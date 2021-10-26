import XLSX from 'xlsx';

export type DayOfTheWeek = 'M' | 'T' | 'W' | 'R' | 'F';
export const daysOfTheWeek = 'MTWRF'.split('') as DayOfTheWeek[];

export interface Course {
    code: string;
    name: string;
    term: string;
    section: string;
    times: { dayOfWeek: DayOfTheWeek, startTime: number, endTime: number }[];
    location?: string | undefined;
    instructor?: string | undefined;
    startDate: XLSX.SSF.SSF$Date;
    endDate: XLSX.SSF.SSF$Date;
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function* colGen() {
    function* colGenL(depth: number): Iterable<string> {
        if (depth === 0) {
            yield '';
            return;
        }
        for (const a of alphabet) {
            for (const x of colGenL(depth - 1)) {
                yield a + x;
            }
        }
    }
    let len = 1;
    while (true) {
        yield* colGenL(len++);
    }
}

const headerFieldMap = {
    '': 'fullDesc',
    'Course Listing': 'courseName',
    'Credits': 'credits',
    'Grading Basis': 'gradingBasis',
    'Section': 'section',
    'Instructional Format': 'format',
    'Delivery Mode': 'deliveryMode',
    'Meeting Patterns': 'meetingPatterns',
    'Registration Status': 'registrationStatus',
    'Instructor': 'instructor',
    'Start Date': 'startDate',
    'End Date': 'endDate'
} as const;

export function parseSchedule(data: Uint8Array) {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const courseFields = [];
    for (const col of colGen()) {
        if (col === 'A') {
            courseFields.push('fullDesc');
            continue;
        }

        const cell = sheet[col + '3']?.v;
        if (!cell) {
            break;
        }
        if (cell in headerFieldMap) {
            courseFields.push(headerFieldMap[cell as keyof typeof headerFieldMap]);
        }
    }
    
    const contents = XLSX.utils.sheet_to_json(sheet, {
        range: 'A4-AA999',
        header: courseFields as any
    }) as { [Key in typeof courseFields[number]]: string }[];

    return contents.flatMap(row => {
        if (row.registrationStatus !== "Registered") {
            return [] as Course[];
        }
        const [, code, name] = /(.*?) - (.*)/.exec(row.courseName)!;
        const [, section] = RegExp(`${code}-(.*?) `).exec(row.section)!;
        const [, semester, termName] = /(Fall|Spring) (.*?)(?: Term)?$/.exec(row.fullDesc)!;
        const term = termName === 'Semester' ? semester[0] : termName;
        const startDate = XLSX.SSF.parse_date_code(row.startDate as any as number);
        const endDate = XLSX.SSF.parse_date_code(row.endDate as any as number);

        const instructor = row.instructor || undefined;

        if (row.meetingPatterns) {
            if ((row.meetingPatterns).startsWith('|')) {
                return [{
                    code,
                    name,
                    term,
                    section,
                    times: [],
                    location: row.meetingPatterns.slice(2),
                    instructor,
                    startDate,
                    endDate
                }];
            }
            
            const [, daysStr, startTimeStr, endTimeStr, location] = /((?:[MTWRF]-)*[MTWRF]) \| (.+?) - (.+?) \| (.+)/.exec(row.meetingPatterns)!;

            const days = daysStr.split('-');

            function parseTime(str: string) {
                const [, hour, minutes, halfDayMarker] = /([0-9]{1,2}):([0-9]{2}) (AM|PM)/.exec(str)!;
                const hourOffset = halfDayMarker === 'PM' ? 12 : 0;
                const hour24 = hour === '12' ? 0 : +hour;
                return hour24 + hourOffset + (+minutes / 60);
            }

            const startTime = parseTime(startTimeStr);
            const endTime = parseTime(endTimeStr);

            const times: Course['times'] = days.map(dayOfWeek => ({
                dayOfWeek: dayOfWeek as any,
                startTime,
                endTime
            }));

            return [{
                code,
                name,
                term,
                section,
                times,
                location,
                instructor,
                startDate,
                endDate
            }];
        }

        return [{
            code,
            name,
            term,
            section,
            times: [],
            instructor,
            startDate,
            endDate
        }];
    });
}