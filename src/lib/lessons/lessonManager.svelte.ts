import { json } from "@sveltejs/kit";
import { SAVE_LESSON_KEY_PREFIX, type LessonSave } from "./savedLessons.svelte";
import type { LessonData } from "./types";
import { browser } from "$app/environment";


type Command = {
    do: () => unknown,
    undo: () => unknown,
}

export const SYMBOL_SAVED_LESSONS = Symbol("lessonManager");
export const SYMBOL_OPEN_OPERATION_WARNING_MODAL = Symbol("openOperationWarningModal");
export const SYMBOL_OPEN_LESSON_EXPORT_MODAL = Symbol("openLessonExportModal");

export type LessonsManager = {
    getSaveId: () => string,
    getSaveName: () => string,
    setSaveName: (name: string) => void,
    getLessonSave: () => LessonSave | undefined,

    getLessons: () => LessonData[],
    canUndo: () => boolean,
    canRedo: () => boolean,

    add: (lesson: LessonData) => boolean,
    remove: (id: string) => boolean,
    update: (oldId: string, newLesson: LessonData) => boolean,

    undo: () => boolean,
    redo: () => boolean,

    startBatch: () => boolean,
    endBatch: () => boolean,
}

const MAX_STACK_SIZE = 120;


export function createLessonManager(lessons_: LessonData[], saveId: string, saveName_: string): LessonsManager{
    let lessons = $state(lessons_);
    let saveName = $state(saveName_);

    let stack: Command[] = $state([]);
    let cmdIdx = $state(0);

    let inBatch = false;
    
    const areLessonsUpToDate = () => {
        if(!browser){
            return false;
        }

        return JSON.stringify(JSON.parse(localStorage.getItem(`${SAVE_LESSON_KEY_PREFIX}${saveId}`) ?? "")?.lessons) === JSON.stringify($state.snapshot(lessons));
    }
    
    // $inspect(stack);
    // $inspect(cmdIdx);

    const canUndo = $derived(cmdIdx != 0);
    const canRedo = $derived(stack.length > cmdIdx);

    const addLesson = (lesson: LessonData) => lessons.push(lesson);
    const removeLesson = (id: string) => lessons.splice(lessons.findIndex(l => l.id === id), 1);

    const saveLessons = () => {
        if(!browser){
            return;
        }

        localStorage.setItem(`${SAVE_LESSON_KEY_PREFIX}${saveId}`, JSON.stringify({
                id: saveId,
                saveName,
                lessons,
                lastModification: 0
            } as LessonSave)
        );
    }

    saveLessons();

    const getLessonSave = () => {
        if(!browser){
            return;
        }

        return JSON.parse(localStorage.getItem(`${SAVE_LESSON_KEY_PREFIX}${saveId}`) ?? "") as LessonSave
    }

    const addLessonCommand = (lesson: LessonData) => (
        lessons.some(l => l.id === lesson.id) ?
            false
        :
            {
                do: () => addLesson(lesson),
                undo: () => removeLesson(lesson.id),
            } as Command
    );

    const removeLessonCommand = (id: string) => {
        const lesson = lessons.find(l => l.id === id);

        return lesson ? 
            {
                do: () => removeLesson(id),
                undo: () => addLesson(lesson)
            } as Command
        :
            false
        ;
    };

    const updateLessonCommand = (oldId: string, newLesson: LessonData) => {
        const oldLesson = lessons.find(l => l.id === oldId);

        return oldLesson ?
            {
                do: () => {removeLesson(oldId); addLesson(newLesson);},
                undo: () => {removeLesson(newLesson.id); addLesson(oldLesson)}
            } as Command
        :
            false
    };

    const startBatchCommand = () => {
        if (inBatch){
            return false;
        }

        return {
            do: () => {
                inBatch = true;

                while(canRedo && inBatch){
                    redo();
                }
            },
            undo: () => {
                inBatch = false;
            }
        } as Command
    }

    const endBatchCommand = () => {
        if (!inBatch){
            return false;
        }

        return {
            do: () => {
                inBatch = false;
            },
            undo: () => {
                inBatch = true;

                while (canUndo && inBatch){
                    undo();
                }
            }
        } as Command
    }

    const processCommand = (cmd: Command | false) => {
        // console.log(lessons);
        if (!cmd || !areLessonsUpToDate()){
            return false;
        }

        cmd.do();
        stack[cmdIdx] = cmd;
        cmdIdx++;

        while (stack.length > cmdIdx){
            stack.pop();
        }

        while (stack.length >= MAX_STACK_SIZE){
            stack.shift();
            cmdIdx--;
        }

        saveLessons();

        return cmd;
    }

    const undo = () => {

        // console.log("undo");

        if (!areLessonsUpToDate()){
            return false;
        }

        if (canUndo){
            cmdIdx--;
            stack[cmdIdx].undo();
        }

        saveLessons();

        return true;
    }

    const redo = () => {
        // console.log("redo");

        if (!areLessonsUpToDate()){
            return false;
        }

        if (canRedo){
            cmdIdx++;
            stack[cmdIdx - 1].do();
        }

        saveLessons();

        return true;
    }

    return {
        getSaveId: () => saveId,
        getSaveName: () => saveName,
        setSaveName: (name: string) => {saveName = name; saveLessons()},
        getLessonSave,

        getLessons: () => lessons,
        canUndo: () => canUndo,
        canRedo: () => canRedo,

        add: (lesson: LessonData) => Boolean(processCommand(addLessonCommand(lesson))),
        remove: (id: string) => Boolean(processCommand(removeLessonCommand(id))),
        update: (oldId: string, newLesson: LessonData) => Boolean(processCommand(updateLessonCommand(oldId, newLesson))),

        undo,
        redo,

        startBatch: () => Boolean(processCommand(startBatchCommand())),
        endBatch: () => Boolean(processCommand(endBatchCommand())),
    }

}