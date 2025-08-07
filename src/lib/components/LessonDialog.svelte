<script lang="ts">
	import { lessonDataFromLesson, timeToNumber, type Lesson, type LessonData } from "$lib/lessons/types";
	import LessonInput from "./inputs/LessonInput.svelte";

    type Props = {
        lesson?: Lesson | null,
        dialogElement: HTMLDialogElement,
        onSave: (lesson: LessonData) => void
    }

    let {lesson = null, dialogElement=$bindable(), onSave}: Props = $props();

    const isValidLesson = (l: Lesson) => 
        l.subjectName !== "" && 
        l.startTime !== null && l.endTime !== null && l.startTime && l.endTime && timeToNumber(l.startTime) < timeToNumber(l.endTime) && 
        l.day !== null && 
        l.courseType !== "";

    const lessonSaveHandler = (l: Lesson | null) => {
        if (l === null || !isValidLesson(l)){
            return;
        }
  
        onSave(lessonDataFromLesson(l, true));
        dialogElement.close();
    }

    const isInvalid = $derived(lesson === null || !isValidLesson(lesson));

</script>

<dialog
    class="dialog"
    bind:this={dialogElement}
>
    <div>
        <LessonInput bind:lesson={lesson}/>
    </div>
    <div class="dialog__buttons">
        <button class="button button--primary-filled icon-text --pulse-on-hover" 
            onclick={() => lessonSaveHandler(lesson)} 
            disabled={isInvalid}
        >
            <span class="ix--disk"></span>
            <p>Mentés</p>
        </button>
        <button class="button --pulse-on-hover" onclick={() => dialogElement.close()}>Mégsem</button>
    </div>
</dialog>