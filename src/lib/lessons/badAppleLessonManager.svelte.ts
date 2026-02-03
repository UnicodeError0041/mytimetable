import { browser } from "$app/environment";
import { type LessonsManager } from "./lessonManager.svelte";
import type { LessonData, LessonVideo } from "./types";

export interface BadAppleLessonManager extends LessonsManager{
    start: () => void,
    cancel: () => void,
    isPlaying: () => boolean,
    isLoading: () => boolean,
    loadingPromise: () => Promise<void>
    pause: () => void;
    nextFrame: () => void;
    prevFrame: () => void;
}

export function createBadAppleLessonManager(): BadAppleLessonManager{

    let lessons: LessonData[] = $state([]);
    let isPlaying: boolean = $state(false);

    let isLoading: boolean = $state(true);

   
    let video: LessonVideo = $state(null!);

    let timeToSleep = 1000;

    let frames: LessonData[][] = [];

    // const getFrame = (frame: number) => video.blocks
    //     .filter(b => b.start_time <= frame && b.end_time >= frame)
    //     .map(b => b.lessonData)

    const loadingPromise = fetch("/result.json").then(res => res.json()).then(res => {
        video = res; 
        isLoading = false;
        timeToSleep = 1000 / video.fps;

        for(let i = 0; i < video.frame_count; i++){
            frames[i] = [];
        }

        for(let i = 0; i < video.blocks.length; i++){
            
            const block = video.blocks[i];

            for(let j = block.start_time; j <= block.end_time; j++){
                frames[j].push(block.lessonData);
            }
        }
    });

    let currentFrame = 0;

    let timeout: NodeJS.Timeout|undefined = undefined;

    const nextFrame = () => {
        if(currentFrame == video.frame_count - 1){
            return;
        }

        lessons = frames[currentFrame];
        currentFrame++;
    }

    const prevFrame = () => {
        if(currentFrame == 0){
            return;
        }
        
        lessons = frames[currentFrame];
        currentFrame--;
    }
        
    const startPlaying = () => {
        isPlaying = true;

        const startTime = Date.now();

        timeout = setInterval(() => {
            if(!isPlaying){
                return;
            }

            const nextFrameTime = startTime + (currentFrame + 1) * timeToSleep;

            let time = Date.now();

            while(nextFrameTime <= time){
                currentFrame++;
                time -= timeToSleep;
            }

            nextFrame()

            if(currentFrame >= frames.length || lessons.length === 0){
                cancelPlaying();
            }
        }, timeToSleep);
    }

    const cancelPlaying = () => {
        clearInterval(timeout);

        isPlaying = false;
        currentFrame = 0;
    }


    return {
        start: startPlaying,
        cancel: cancelPlaying,
        isPlaying: () => isPlaying,
        isLoading: () => isLoading,
        loadingPromise: () => loadingPromise,
        pause: () => clearInterval(timeout),
        nextFrame,
        prevFrame,

        add: (_) => false,
        canRedo: () => false,
        canUndo: () => false,
        undo: () => false,
        redo: () => false,
        getLessonSave: () => undefined,
        getSaveName: () => "Bad Apple",
        startBatch: () => false,
        endBatch: () => false,
        getSaveId: () => "Bad Apple",
        getLessons: () => lessons,
        remove: () => false,
        setSaveName: (_) => {},
        update: (_ , __) => false
    }
}