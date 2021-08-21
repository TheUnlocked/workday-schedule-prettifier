import { PropsWithChildren } from "react";
import styled from "styled-components";
import AutoScaling from "./AutoScaling";
import { Course, DayOfTheWeek, daysOfTheWeek } from "./schedule";
import { Stacked } from "./Utils";

export default function ScheduleView(props: {
    courses: Course[]
}) {
    const coursesByTerm = [[], [], [], []] as Course[][];

    for (const course of props.courses) {
        switch (course.term) {
            case 'A':
                coursesByTerm[0].push(course);
                break;
            case 'B':
                coursesByTerm[1].push(course);
                break;
            case 'F':
                coursesByTerm[0].push(course);
                coursesByTerm[1].push(course);
                break;
            case 'C':
                coursesByTerm[2].push(course);
                break;
            case 'D':
                coursesByTerm[3].push(course);
                break;
            case 'S':
                coursesByTerm[2].push(course);
                coursesByTerm[3].push(course);
                break;
        }
    }

    return (
        <Stacked $gap="2em">
            {coursesByTerm.map((x, i) =>
                x.length > 0
                    ? <TermView key={i} term={String.fromCharCode(i + 65)} courses={x} />
                    : null
            )}
        </Stacked>
    );
}

const DaysContainer = styled(Stacked)`
    border-radius: 4px 4px 4px 0;
    border: 1px solid var(--primary-color);
    overflow: hidden;
`;

const DayContainer = styled(Stacked)<{ $position: DayOfTheWeek }>`
    ${props => props.$position === 'F' ? 'border-radius: 0 0 4px 0;' : ''}
`;

const HoursContainer = styled(Stacked)`
    border: 1px solid var(--primary-color);
    border-right: 0;
    border-radius: 4px 0 0 4px;
    overflow: hidden;
    margin-top: calc(20.8px + 8px);
`;

const Header = styled.span<{ $filled?: boolean }>`
    ${props => props.$filled
        ? 'background-color: var(--primary-color);'
        : ''}
    ${props => props.$filled ? 'color: var(--text-on-primary);' : ''}
    border-bottom: 1px solid var(--primary-color);
    text-align: center;
    padding: 4px 0;
    font-weight: bold;
`;

const Hour = styled(Stacked)<{ $squish?: boolean, $ratio?: number }>`
    height: ${props => (props.$ratio ?? 1) * 5}em;
    ${props => props.$squish ? '' : 'width: 10em;'}
`;

const CourseHourFilled = styled(Hour)<{ $secondary: number, $start?: boolean, $end?: boolean }>`
    color: var(--text-on-primary);
    background: var(--secondary${props => props.$secondary});
    border-radius: ${props => props.$start ? '4px 4px' : '0 0'} ${props => props.$end ? '4px 4px' : '0 0'};
    margin-right: 4px;
`;

const CourseHourBlank = styled(Hour)`
    margin-right: 4px;
`;

const Content = styled.div`
    padding: 4px;
`;

const Truncate = styled.div`
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 100%;
`;

function CourseHour(props: PropsWithChildren<{ secondary: number, ratio: number, start?: boolean, end?: boolean }>) {
    return <>
        <CourseHourFilled $secondary={props.secondary} $ratio={props.ratio} $start={props.start} $end={props.end}>{props.children}</CourseHourFilled>
        <CourseHourBlank $ratio={1 - props.ratio} />
    </>;
}

function formatHour(hour: number) {
    let half = 'AM';
    if (hour === 12) {
        half = 'PM';
    }
    else if (hour > 12) {
        hour -= 12;
        half = 'PM';
    }
    if (hour === 0) {
        hour = 12;
    }
    return `${hour}:00 ${half}`;
}

function TermView(props: {
    term: string,
    courses: Course[]
}) {
    const startHour = Math.floor(Math.min(...props.courses.flatMap(x => x.times.map(x => x.startTime))));
    const endHour = Math.ceil(Math.max(...props.courses.flatMap(x => x.times.map(x => x.endTime))));

    function makeEmptyDayHours() {
        return new Array(endHour - startHour).fill(undefined).map((_, i) => <Hour key={i}/>);
    }

    const hours = {
        'M': makeEmptyDayHours(),
        'T': makeEmptyDayHours(),
        'W': makeEmptyDayHours(),
        'R': makeEmptyDayHours(),
        'F': makeEmptyDayHours()
    };

    props.courses.forEach((course, i) => {
        for (const time of course.times) {
            for (let hour = time.startTime; hour < time.endTime; hour++) {
                const start = hour === time.startTime;
                const end = hour + 1 > time.endTime;

                hours[time.dayOfWeek][hour - startHour] =
                    <CourseHour secondary={(i % 4) + 1} ratio={Math.min(1, time.endTime - hour)} start={start} end={end}>
                        {hour === time.startTime
                            ? <Content>
                                <AutoScaling>{course.code}-{course.section}</AutoScaling>
                                <Truncate>{course.name}</Truncate>
                                {course.location ? <AutoScaling>{course.location}</AutoScaling> : null}
                            </Content>
                            : ''}
                    </CourseHour>;
            }
        }
    });

    return (
        <Stacked $horizontal>
            <HoursContainer>
                <Header $filled>Time</Header>
                {new Array(endHour - startHour).fill(undefined).map((_, i) =>
                    <Hour $squish>
                        <Content>
                            {formatHour(i + startHour)}
                        </Content>
                    </Hour>
                )}
                <Hour $squish $ratio={0.5}>
                    <Content>
                        {formatHour(endHour)}
                    </Content>
                </Hour>
            </HoursContainer>
            <DaysContainer>
                <Header $filled>
                    {props.term} Term
                </Header>
                <Stacked $horizontal>
                    {daysOfTheWeek.map((dayOfTheWeek, i) =>
                        <DayContainer key={i} $position={dayOfTheWeek}>
                            <Header>{dayOfTheWeek}</Header>
                            <CourseHourBlank $ratio={0.23} />
                            {hours[dayOfTheWeek]}
                        </DayContainer>
                    )}
                </Stacked>
            </DaysContainer>
        </Stacked>
    );
}