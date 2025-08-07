import { semesterToString, type Lesson, type LessonData, type Semester } from "./types";
import {MD5} from "object-hash";
import {createQuery, type CreateQueryResult, type QueryObserverResult} from '@tanstack/svelte-query';


export const QUERY_MODES = ["keresnevre", "keres_kod_azon", "keres_okt"];

export type QueryMode = "keresnevre" | "keres_kod_azon" | "keres_okt";

export const MODE = "m";
export const SEMESTER = "f";
export const KEYWORD = "k";

const URL = "/api/lessonQuery";

export const SYMBOL_LESSONS_QUERY = Symbol("lessonsQuery");

export type QueryData = {
    query: QueryObserverResult<LessonData[], Error> | null
}

export async function fetchLessons(semester:Semester, keyword:string, mode: QueryMode):Promise<LessonData[]> {
    return (
        (
            await (
                await fetch(`${URL}?${MODE}=${mode}&${SEMESTER}=${semesterToString(semester)}&${KEYWORD}=${keyword}`)
            ).json()
        ) as Lesson[]
    ).map(lesson => ({id:MD5(lesson), lesson}))
} 

export const createLessonsQuery = (semester:Semester, keyword:string, mode: QueryMode) => createQuery({
        queryKey: ["lessons", keyword, semesterToString(semester), mode],
        queryFn: () => fetchLessons(semester, keyword, mode)
});

