import type { LessonSave } from "./savedLessons.svelte";
import { type DayOfWeek, type Time, type Semester, type LessonData, timeFromString, type Lesson, timeToNumber, lessonDataFromLesson } from "./types";
import {v4 as uuidv4} from "uuid";
import JSONCrush from 'JSONCrush';

type EncodedLesson = {
    subjectName: string,
    subjectCode?: string,
    day?: DayOfWeek,
    startTime?: Time,
    endTime?: Time,
    detailedTime?: string,
    semester?: Semester,
    location?: string,
    courseType: string,
    courseCode?: string,
    teacherAndComment?: string,
    edited?: true
}

type EncodedSave = {
    name: string,
    lessons: EncodedLesson[]
}

export function timesFromDetailedTime(detailedTime: string | null): {startTime: Time | null, endTime: Time | null, day: DayOfWeek | null}{
    if (detailedTime === null){
        return {
            startTime: null,
            endTime: null,
            day: null
        }
    }

    const parts = detailedTime.split(" ");
    
    let day: DayOfWeek | null = null;

    let startTime: Time | null = null;
    let endTime: Time | null = null;

    if (parts && parts[1].includes("-")){
        day = parts[0].toLowerCase()[0] as DayOfWeek;

        const [startTimeStr, endTimeStr] = parts[1].split("-",2);

        startTime = timeFromString(startTimeStr);
        endTime = timeFromString(endTimeStr);
    }
    
    return {
        startTime,
        endTime,
        day
    }
}

function encodeLesson(data: LessonData): EncodedLesson{
    const {startTime: readStartTime, endTime: readEndTime, day: readDay} = timesFromDetailedTime(data.lesson.detailedTime);

    const startTime = readStartTime !== null && (data.lesson.startTime === null || timeToNumber(readStartTime) === timeToNumber(data.lesson.startTime))
                ? 
                    undefined
                :
                data.lesson.startTime !== null 
                ?
                    data.lesson.startTime
                :
                    undefined;

    const endTime = readEndTime !== null  && (data.lesson.endTime === null || timeToNumber(readEndTime) === timeToNumber(data.lesson.endTime))
                ? 
                    undefined
                :
                data.lesson.endTime !== null 
                ?
                    data.lesson.endTime
                :
                    undefined;

    const day = readDay !== null && readDay === data.lesson.day
                ? 
                    undefined
                :
                data.lesson.day !== null 
                ?
                    data.lesson.day
                :
                    undefined;

    return {
        subjectName: data.lesson.subjectName,
        subjectCode: data.lesson.subjectCode === "" ? undefined : data.lesson.subjectCode,

        courseType: data.lesson.courseType,
        courseCode: data.lesson.courseCode === "" ? undefined : data.lesson.courseCode,

        day,
        startTime,
        endTime,
        detailedTime: data.lesson.detailedTime ?? undefined,
        semester: data.lesson.semester ?? undefined,

        location: data.lesson.location === "" ? undefined : data.lesson.location,
        teacherAndComment: data.lesson.teacherAndComment === "" ? undefined : data.lesson.teacherAndComment,

        edited: data.edited ? true : undefined
    }
}

function decodeLesson(encoded: EncodedLesson): LessonData {
    const {startTime: readStartTime, endTime: readEndTime, day: readDay} = timesFromDetailedTime(encoded.detailedTime ?? null);

    const startTime = encoded.startTime ?? readStartTime;
    
    const endTime = encoded.endTime ?? readEndTime;
    
    const day = encoded.day ?? readDay


    const lesson: Lesson = {
        subjectName: encoded.subjectName,
        subjectCode: encoded.subjectCode ?? "",

        courseType: encoded.courseType,
        courseCode: encoded.courseCode ?? "",

        day,
        startTime,
        endTime,
        detailedTime: encoded.detailedTime ?? null,
        semester: encoded.semester ?? null,

        location: encoded.location ?? "",
        teacherAndComment: encoded.teacherAndComment ?? ""
    }

    return lessonDataFromLesson(lesson, encoded.edited);
}

function encodeSave(save: LessonSave): EncodedSave{
    return {
        name: save.saveName,
        lessons: save.lessons.map(encodeLesson)
    }
}


function decodeSave(encoded: EncodedSave): LessonSave{
    return {
        id: uuidv4(),
        saveName: encoded.name,
        lessons: encoded.lessons.map(decodeLesson),
        lastModification: 0,
    }
}

export function encodeURI(save: LessonSave): string {
    return encodeURIComponent(JSONCrush.crush(JSON.stringify(encodeSave(save))));
}


export function decodeURI(uri: string): LessonSave {
    return decodeSave(JSON.parse(JSONCrush.uncrush(decodeURIComponent(uri))));
}