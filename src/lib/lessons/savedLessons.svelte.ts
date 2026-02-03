import { browser } from "$app/environment";
import { createLessonManager, type LessonsManager as LessonManager } from "./lessonManager.svelte"
import type { LessonData } from "./types";
import {v4 as uuidv4} from "uuid";

const SAVE_LESSON_IDS_KEY = "saveLessonIds";
export const SAVE_LESSON_KEY_PREFIX = "save";

export type SavedLessons = {
    getMaxSaveCount: () => number,
    getSaveIds: () => string[],
    getSaveNameForId: (id: string) => string | undefined,
    getCurrentManager: () => LessonManager,

    createSave: (name?: string, lessons?: LessonData[]) => string | false,
    switchSave: (id: string) => boolean,
    removeSave: (id: string) => boolean,

    moveSave: (id1: string, idx: number) => boolean
}

export type LessonSave = {
    id: string,
    saveName: string,
    lessons: LessonData[],
    lastModification: number
}

export function loadSavedLessonsFromLocalStorage(): SavedLessons{
    const MAX_SAVE_COUNT = 10;

    let saveIds = $state(browser ? JSON.parse(localStorage.getItem(SAVE_LESSON_IDS_KEY) ?? "[]") as string[] : []);

    let saves = $state(saveIds
        .map(id => browser ?
                JSON.parse(
                    localStorage.getItem(`${SAVE_LESSON_KEY_PREFIX}${id}`) ?? "null"
                )
            :
                null
        )
        .filter(s => s !== null) as LessonSave[]
    );

    const saveIds_ = $derived(saveIds);

    $effect(() => {
        localStorage.setItem(SAVE_LESSON_IDS_KEY, JSON.stringify(saveIds));
    })

    let managers = $state(saves.map(s => createLessonManager(s.lessons, s.id, s.saveName)));

    const areSavesUpToDate = () => {
        if (!browser){
            return false;
        }
        return localStorage.getItem(SAVE_LESSON_IDS_KEY) === JSON.stringify($state.snapshot(saveIds));
    }

    let ignoreSavesUpToDate = true;

    const createSave = (name?: string, lessons?: LessonData[]) => {
        if(saves.length >= MAX_SAVE_COUNT || (!areSavesUpToDate() && !ignoreSavesUpToDate)){
            return false;
        }

        lessons ??= [];
        name ??= Math.random() < 0.05 ? "Vesztettél" : "Új órarend";

        const id = uuidv4();

        const save: LessonSave = {
            id,
            saveName: name,
            lessons,
            lastModification: 0
        }

        saveIds.push(id);
        saves.push(save);
        managers.push(createLessonManager(save.lessons, save.id, save.saveName));

        return id;
    }

    if (saves.length === 0){
        createSave();
        if(browser){
            localStorage.setItem(SAVE_LESSON_IDS_KEY, JSON.stringify(saveIds));
        }
    }

    ignoreSavesUpToDate = false;

    let currentManager = $state(managers[0]);

    const switchSave = (id: string) => {
        const idx = managers.findIndex(m => m.getSaveId() == id);

        if (idx === -1){
            return false;
        }

        currentManager = managers[idx];

        return true;
    }

    const removeSave = (id: string) => {
        const idx = saveIds.findIndex(n => n === id);

        if (idx === -1 || !areSavesUpToDate()){
            return false;
        }

        saveIds.splice(idx, 1);

        const savesIdx = saves.findIndex(s => s.id === id);
        saves.splice(savesIdx, 1);

        const managersIdx = managers.findIndex(m => m.getSaveId() === id);
        managers.splice(managersIdx, 1);

        localStorage.removeItem(`${SAVE_LESSON_KEY_PREFIX}${id}`);

        if (currentManager.getSaveId() === id){
            currentManager = managers[idx % saveIds.length];
        }

        return true;
    }

    const moveSave = (id: string, idx: number) => {
        if(!saveIds.includes(id) || idx < 0 || idx >= saveIds.length || (!areSavesUpToDate() && !ignoreSavesUpToDate)){
            return false;
        }

        let currentIdx = saveIds.indexOf(id);

        const direction = currentIdx < idx ? 1 : -1;
        
        for(;currentIdx !== idx; currentIdx += direction){
            saveIds[currentIdx] = saveIds[currentIdx + direction]
        }

        saveIds[currentIdx] = id;
    
        return true;
    }

    return {
        getMaxSaveCount: () => MAX_SAVE_COUNT,
        getSaveIds: () => saveIds_,
        getSaveNameForId: (id: string) => managers.find(m => m.getSaveId() === id)?.getSaveName(),
        getCurrentManager: () => currentManager,

        createSave,
        switchSave,
        removeSave,

        moveSave,
    }

}