import { MD5 } from "object-hash"

export type DayOfWeek = "h" | "k" | "s" | "c" | "p"

export type Time = {
    hour: number,
    minute: number,
}

export type Semester = {
    startYear: number,
    isSpring: boolean
}

export type Lesson = {
    subjectName: string,
    subjectCode: string,
    day: DayOfWeek | null,
    startTime: Time | null,
    endTime: Time | null,
    detailedTime: string | null,
    semester: Semester | null,
    location: string,
    courseType: string,
    courseCode: string,
    teacherAndComment: string,
}


export type LessonData = {
    id: string,
    lesson: Lesson,
    edited?: boolean
}

export function timeToString(time: Time): `${number}:${number}` {
    return `${time.hour.toLocaleString("hu-HU", {minimumIntegerDigits: 2})}:${time.minute.toLocaleString("hu-HU", {minimumIntegerDigits: 2})}` as `${number}:${number}`;
}

export function timeFromString(time: string): Time{
    return {
        hour: Number(time.split(":")[0]),
        minute: Number(time.split(":")[1])
    }
}

export function semesterToString(semester: Semester): `${number}-${number}-${number}` {
    return `${semester.startYear}-${semester.startYear + 1}-${semester.isSpring ? 2 : 1}`;
}

export function semesterFromString(str: string): Semester {
    const parts = str.split("-");
    return {
        startYear: Number(parts[0]),
        isSpring: parts[2] === "2" 
    };
}

export function timeToNumber(time: Time): number{
    return time.hour * 60 + time.minute;
}

export function dayOfWeekToString(day: DayOfWeek): string{
    switch(day){
        case "h":
            return "hétfő";
        case "k":
            return "kedd";
        case "s":
            return "szerda";
        case "c":
            return "csütörtök";
        case "p":
            return "péntek";
    }
}

export function lessonDataFromLesson(lesson: Lesson, edited?: boolean): LessonData{
    return {id: MD5(lesson), lesson, edited};
}

export function getDefaultLesson(): Lesson{
    return {
        subjectCode: "",
        subjectName: "",
        teacherAndComment: "",
        courseCode: "", 
        courseType: "gyakorlat", 
        day: "h", 
        detailedTime: null, 
        startTime: {
            hour: 8,
            minute: 0
        },
        endTime: {
            hour: 9,
            minute: 0,
        },
        location: "",
        semester: null,

    };
}

export function hasTimetableData(lesson: Lesson): boolean {
    return lesson.startTime !== null && lesson.endTime !== null && lesson.day !== null;
}
