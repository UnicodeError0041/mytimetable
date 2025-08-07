import { MD5 } from "object-hash";
import { fetchLessons } from "./query";
import type { Lesson, LessonData, Semester } from "./types"
import {SvelteMap} from "svelte/reactivity"

type LessonKey = {
    subjectCode: string,
    courseType: string,
    semester: Semester
}

export type LessonAlternatives = {
    getMap: () => Map<string, LessonData[]>,
    getAlternativesToLesson: (lesson: Lesson) => LessonData[] | undefined,
    addAlternatives: (subjectCode: string, semester: Semester, courseType?: string) => Promise<void>,
    addAlternativesToLesson: (lesson: Lesson) => Promise<void>,
}

export const SYMBOL_LESSON_ALTERNATIVES = Symbol("lesson alternatives");

export function createLessonAlternatives(): LessonAlternatives{
    let map: SvelteMap<string, LessonData[]> = $state(new SvelteMap());

    let usedKeys: Set<string> = new Set();

    const addAlternatives = async (subjectCode: string, semester: Semester, courseType?: string) => {
        
        if (usedKeys.has(MD5({subjectCode, semester, courseType} as LessonKey))){
            return;
        }

        const lessons = (await fetchLessons(semester, subjectCode, "keres_kod_azon")).filter(l => 
            l.lesson.subjectCode === subjectCode && 
            l.lesson.semester?.startYear === semester.startYear && 
            l.lesson.semester?.isSpring === semester.isSpring
        );


        // console.log(lessons);

        for(const data of lessons){
            const key = MD5({subjectCode, semester, courseType: data.lesson.courseType} as LessonKey);

            if (map.has(key)){
                map.get(key)?.push(data);
            } else {
                map.set(key, [data]);
            }

            usedKeys.add(key);
            // console.log({map, usedKeys});
        }

        // map = map;
        // usedKeys = usedKeys;
        
        
    }

    const addAlternativesToLesson = async (lesson: Lesson) => {

        if (lesson.semester){
            await addAlternatives(lesson.subjectCode, lesson.semester, lesson.courseType);
        }

    }

    const getAlternativesToLesson = (lesson: Lesson) => {
        const returned = map.get(MD5({subjectCode: lesson.subjectCode, semester: lesson.semester, courseType: lesson.courseType} as LessonKey));

        // console.log(returned);
        return returned;
    }

    return {
        getMap: () => map,
        getAlternativesToLesson,
        addAlternatives,
        addAlternativesToLesson,
    }
}