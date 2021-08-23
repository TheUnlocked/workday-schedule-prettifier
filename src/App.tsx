import { createEvents } from 'ics';
import { useState } from 'react';
import styled from 'styled-components';
import Button from './Button';
import FileInputButton from './FileInputButton';
import { Course, parseSchedule } from './schedule';
import ScheduleView from './ScheduleView';
import { Stacked } from './Utils';
import { saveAs } from 'file-saver';
import { DateTime } from 'luxon';
import { useWindowSize } from './useWindowSize';

const AppWrapper = styled.div`
    background-color: var(--background-color);
    font-family: var(--font-family);
    font-size: var(--font-size);
    color: var(--text);
    overflow: hidden;
`;

const AppContent = styled.div<{ $scale: number }>`
    padding: 2em;
    min-height: calc(100vh - 4em);
    display: flex;
    flex-direction: column;
    gap: 2em;
    min-width: 970px;

    transform-origin: top left;
    ${props => props.$scale > 1 ? '' : `transform: scale(${props.$scale});` }
`;

function App() {
    const [schedule, setSchedule] = useState<Course[] | null>(null);

    function fileSelectedHandler([file]: FileList) {
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                setSchedule(parseSchedule(data));
            }
            reader.readAsArrayBuffer(file);
        }
        else {
            setSchedule(null!);
        }
    }

    function downloadCalendar() {
        function generateRecurrenceRule(course: Course) {
            const DAY_MAP = {
                M: 'MO',
                T: 'TU',
                W: 'WE',
                R: 'TH',
                F: 'FR'
            };
            const endingTimestamp = `${course.endDate.y}${course.endDate.m.toString().padStart(2, '0')}${course.endDate.d.toString().padStart(2, '0')}`;
            return `FREQ=WEEKLY;BYDAY=${[...new Set(course.times.map(x => DAY_MAP[x.dayOfWeek]))].join(',')};INTERVAL=1;UNTIL=${endingTimestamp}`;
        }

        createEvents(schedule!.filter(x => x.times.length > 0).map(course => {
            let startDate = DateTime.fromObject({
                year: course.startDate.y,
                month: course.startDate.m,
                day: course.startDate.d
            }, {
                zone: 'America/New_York'
            });

            // eslint-disable-next-line array-callback-return
            const numericDaysMet = course.times.map(x => {
                switch (x.dayOfWeek) {
                    case 'M': return 1;
                    case 'T': return 2;
                    case 'W': return 3;
                    case 'R': return 4;
                    case 'F': return 5;
                }
            }) as number[];

            while (!numericDaysMet.includes(startDate.weekday)) {
                startDate = startDate.plus({ days: 1 });
            }

            function getUtcTime(dateTime: DateTime) {
                const { year, month, day, hour, minute } = dateTime.toUTC();
                return [year, month, day, hour, minute] as [number, number, number, number, number];
            }

            const startDateTime = startDate.set({
                hour: Math.floor(course.times[0].startTime),
                minute: Math.round((course.times[0].startTime % 1) * 60)
            });

            const endDateTime = startDate.set({
                hour: Math.floor(course.times[0].endTime),
                minute: Math.round((course.times[0].endTime % 1) * 60)
            });

            return {
                title: `${course.code} - ${course.name}`,
                description: [
                    `Section: ${course.section}`,
                    course.instructor ? `Instructor: ${course.instructor}` : ''
                ].filter(Boolean).join('\n'),
                location: course.location,
                busyStatus: 'BUSY',
                start: getUtcTime(startDateTime),
                end: getUtcTime(endDateTime),
                startInputType: 'utc',
                startOutputType: 'utc',
                recurrenceRule: generateRecurrenceRule(course)
            }
        }), (_, value) => {
            const file = new File([value], 'wpi_schedule.ics');
            saveAs(file);
        });
    }

    const [width] = useWindowSize();

    return (
        <AppWrapper id="app" className="theme-default">
            <AppContent $scale={width / 970}>
                <Stacked $horizontal $gap="1em">
                    <FileInputButton onSelected={fileSelectedHandler} />
                    {schedule ? <Button onClick={downloadCalendar}>Download as iCal</Button> : null}
                </Stacked>
                {schedule ? <ScheduleView courses={schedule} /> : null}
            </AppContent>
        </AppWrapper>
    );
}

export default App;
