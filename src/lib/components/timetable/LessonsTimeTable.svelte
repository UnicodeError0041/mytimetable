<script lang="ts">
	import { semesterToString, type LessonData, type Lesson as LessonType, type Semester } from "$lib/lessons/types";
	import TimeTable from "./TimeTable.svelte";
	import { type TimeTableData } from "./types";
	import Lesson from "../lessons/Lesson.svelte";
	import { getContext } from "svelte";
	import type { SavedLessons } from "$lib/lessons/savedLessons.svelte";
	import { SYMBOL_OPEN_OPERATION_WARNING_MODAL, SYMBOL_SAVED_LESSONS } from "$lib/lessons/lessonManager.svelte";
	import { SYMBOL_LESSON_ALTERNATIVES, type LessonAlternatives } from "$lib/lessons/lessonAlternatives.svelte";
	import Tooltip from "../Tooltip.svelte";
	import LessonDialog from "../LessonDialog.svelte";


    type Props = {
        queriedLessons: LessonData[],
        ownLessons: LessonData[],
        timetableId: string,
        imageMode?: boolean,
        tableState?: "default" | "drag", 
    };

    type LessonSource = "saved" | "queried" | "alternative"

    type SourcedLessonData = {
        source: LessonSource,
        lessonData: LessonData,
    }

    let {queriedLessons, ownLessons: savedLessons, timetableId, imageMode, tableState=$bindable("default")}: Props = $props();


    let alternativeLessons: LessonData[] = $state([]);

    let editLessonDialogOpenHandler: (defaultLesson?: LessonType) => void = $state(null!);

    let editedLesson: LessonData | undefined = $state();


    const sourcedLessons = $derived.by(() => {
        let returned: TimeTableData<SourcedLessonData>[] = [];

        for(const data of savedLessons){
            if (!data.lesson.startTime || !data.lesson.endTime || !data.lesson.day){
                continue;
            }

            returned.push(
                {
                    data: {source: "saved", lessonData: data},
                    time: {startTime: data.lesson.startTime, endTime: data.lesson.endTime, day: data.lesson.day}
                }
            );
        }

        if (tableState === "default" ){
            for (const data of queriedLessons){
                if (!data.lesson.startTime || !data.lesson.endTime || !data.lesson.day || returned.some(d => d.data.lessonData.id === data.id)){
                    continue;
                }

                returned.push(
                    {
                        data: {source: "queried", lessonData: data},
                        time: {startTime: data.lesson.startTime, endTime: data.lesson.endTime, day: data.lesson.day}
                    }
                );
            }
        } else if (tableState === "drag"){
            for (const data of alternativeLessons){
                if (!data.lesson.startTime || !data.lesson.endTime || !data.lesson.day || returned.some(d => d.data.lessonData.id === data.id)){
                    // console.log("ran");
                    continue;
                }
    
                returned.push(
                    {
                        data: {source: "alternative", lessonData: data},
                        time: {startTime: data.lesson.startTime, endTime: data.lesson.endTime, day: data.lesson.day}
                    }
                );
            }
        }


        return returned;
    })

    const savedLessonsContext = getContext<SavedLessons>(SYMBOL_SAVED_LESSONS);
    const currentManager = $derived(savedLessonsContext.getCurrentManager());

    const alternativesCtx = getContext<LessonAlternatives>(SYMBOL_LESSON_ALTERNATIVES);

    const addAllAlternatives = () => {
        savedLessons.forEach(l => alternativesCtx.addAlternativesToLesson(l.lesson));
    }

    $effect(() => {
        addAllAlternatives();
    });

    addAllAlternatives();

    const openOperationWarningModal = getContext(SYMBOL_OPEN_OPERATION_WARNING_MODAL) as () => void;

    let differentSemesterWarningDialog: HTMLDialogElement = $state(null!);
    let differentSemesterWarningDialogConfig: {current_semester: string, new_lesson: LessonData} | undefined = $state(undefined);

    const openDifferentSemesterWarningDialog = (current_semester: string, new_lesson: LessonData) => {
        differentSemesterWarningDialogConfig = {
            current_semester,
            new_lesson
        }

        differentSemesterWarningDialog.showModal();
    }

    const saveLesson = (lesson: LessonData, check_semesters: boolean = true) => {
        let semesters = new Set(
                savedLessons
                    .filter(l => l.lesson.semester !== null)
                    .map(l => semesterToString(l.lesson.semester as Semester))
        )

        if( check_semesters &&
            lesson.lesson.semester !== null && 
            semesters.size === 1 && 
            !semesters.has(semesterToString(lesson.lesson.semester))
        ){
            openDifferentSemesterWarningDialog(semesters.values().next().value as string, lesson);
            return;
        }

        if(!currentManager.add(lesson)){
            openOperationWarningModal();
        }
    }

    const dragStartHandler = async (e: DragEvent, data: LessonData) => {

        requestAnimationFrame(() => {
            if(e.dataTransfer != null){
                e.dataTransfer.effectAllowed = "copyMove";
                e.dataTransfer.dropEffect = "none";

                localStorage.setItem("draggedLesson", JSON.stringify($state.snapshot(data)));

            }

            const alt = alternativesCtx.getAlternativesToLesson(data.lesson);
            
            alternativeLessons = alt;
            tableState = "drag";
            
        })
        
    }

    const dragEndHandler = (e: DragEvent) => {
        e.preventDefault();
        // console.log("drag end");

        if (e.dataTransfer != null){
            tableState = "default";
        }
    }

    const dragOverHandler = (e: DragEvent) => {
        e.preventDefault();

        if (e.dataTransfer){
            e.dataTransfer.dropEffect = "move";
        }
    }

    const dropHandler = (e: DragEvent, data: LessonData) => {
        e.preventDefault();

        const lesson = JSON.parse(localStorage.getItem("draggedLesson") ?? "{}") as LessonData;

        if (lesson.id){
            // console.log("adding lesson");
            if(!currentManager.update(lesson.id, data)){
                openOperationWarningModal();
            }
        }

        localStorage.removeItem("draggedLesson");
    }

    const dragEnterHandler = (e: DragEvent, src: SourcedLessonData) => {
        (e.target as Element).classList.add("lesson--drag-entered");
    }

    const dragLeaveHandler = (e: DragEvent, src: SourcedLessonData) => {
        (e.target as Element).classList.remove("lesson--drag-entered");
    }

    const trashcanDragEnterHandler = (e: DragEvent) => {
        (e.target as Element).classList.add("lesson-timetable__remove-lesson--drag-entered");
    }

    const trashcanDragLeaveHandler = (e: DragEvent) => {
        (e.target as Element).classList.remove("lesson-timetable__remove-lesson--drag-entered");
    }

    const trashcanDropHandler = (e: DragEvent) => {
        e.preventDefault();

        const lesson = JSON.parse(localStorage.getItem("draggedLesson") ?? "{}") as LessonData;

        if (lesson.id){
            // console.log("adding lesson");
            if(!currentManager.remove(lesson.id)){
                openOperationWarningModal();
            }
        }

        localStorage.removeItem("draggedLesson");
    }

    const editStartHandler = (data: LessonData) => {
        editedLesson = data;
        editLessonDialogOpenHandler(structuredClone($state.snapshot(data.lesson)));
    }

    const editEndHandler = (data: LessonData) => {
        if(editedLesson?.id) {
            if(!currentManager.update(editedLesson?.id, data)){
                openOperationWarningModal();
            }
        };
    }

</script>

{#snippet element(data: SourcedLessonData)}
    {@const isLecture = data.lessonData.lesson.courseType === "előadás"}
    {@const isEdited = data.lessonData.edited === true}

    {#if data.source === "saved"}
        {#snippet savedLessonTooltipContent()}

            <p>
                {#if !data.lessonData.edited}
                    Ragadj meg az áthelyezéshez!
                {:else}
                    Ez egy szerkesztett óra
                {/if}
            </p>
            <Tooltip content="Óra törlése">
                <button
                    aria-label="óra törlése"
                    class="button button--icon --fs-h5 --error --pulse-on-hover"
                    onclick={() => {if(!currentManager.remove(data.lessonData.id)){openOperationWarningModal();}}}
                >
                    <span class="ix--trashcan"></span>
                </button>
            </Tooltip>

            <Tooltip content="Óra szerkesztése">
                <button
                    aria-label="óra szerkesztése"
                    class="button button--icon --fs-h5 --secondary --pulse-on-hover"
                    onclick={() => editStartHandler(data.lessonData)}
                >
                    <span class="ix--edit-document"></span>
                </button>
            </Tooltip>
        {/snippet}

        <Lesson lesson={data.lessonData.lesson} {isEdited} classes="lesson--saved --pulse-on-hover {isLecture ? "lesson--lecture" : ""}"
            extraTooltipElement={savedLessonTooltipContent}
            attrs={
            {
                draggable: "true", 
                ondragstart: (e: DragEvent) => dragStartHandler(e, data.lessonData), 
                ondragend: dragEndHandler,
            }}
            triggerType={tableState === "drag" ? "none" : "hover"}
        />
    {:else if data.source === "queried"}
        <Lesson lesson={data.lessonData.lesson} {isEdited} classes="lesson--queried --pulse-on-hover {isLecture ? "lesson--lecture" : ""}"
            extraTooltipElement="Kattints a hozzáadáshoz!"
            attrs={
            {
                onclick: () => saveLesson(data.lessonData), role: "button"
            }}
            triggerType="hover"
        />
    {:else if data.source === "alternative"}
        <Lesson lesson={data.lessonData.lesson} {isEdited} classes="lesson--alternative --pulse {isLecture ? "lesson--lecture" : ""}"
            triggerType="both"
            extraTooltipElement="Dobd ide az órát az áthelyezéshez!"   
            attrs={
            { 
                ondragover: dragOverHandler, 
                ondrop: (e: DragEvent) => dropHandler(e, data.lessonData),
                ondragenter: (e: DragEvent) => dragEnterHandler(e, data),
                ondragleave: (e: DragEvent) => dragLeaveHandler(e, data),
            }}
        />
    {/if}
{/snippet}

<div class="lesson-timetable">
    <div data-lesson-timetable={timetableId}>
        <TimeTable
            datas={sourcedLessons}
            minTime={{hour: 8, minute: 0}}
            maxTime={{hour: 21, minute: 0}}
            style={{heightPerHour: imageMode ? "5rem": "3.5rem"}}
            days={["h", "k", "s", "c", "p"]}
            element={element}
        />
    </div>
    <div class="lesson-timetable__remove-lesson --pulse
        {tableState === "drag" ? "lesson-timetable__remove-lesson--shown" : ""}"
        ondragover={dragOverHandler}
        ondragenter={trashcanDragEnterHandler}
        ondragleave={trashcanDragLeaveHandler}
        ondrop={trashcanDropHandler}
        role="deletion"
    >
        
        <span class="ix--trashcan"></span>
        
    </div>
    <LessonDialog title="Óra szerkesztése" bind:dialogOpenHandler={editLessonDialogOpenHandler} onSave={editEndHandler}/>
</div>

<dialog
    class="dialog"
    bind:this={differentSemesterWarningDialog}
>
    <p class="--fs-h5">Más szemeszter kurzusának hozzáadása</p>
    {#if differentSemesterWarningDialogConfig}
        <div class="icon-text --warning">
            <span class="ix--warning"></span>
            <p>Ez a kurzus <em>{semesterToString(differentSemesterWarningDialogConfig.new_lesson.lesson.semester as Semester)}</em> szemeszterhez tartozik, míg az órarend többi órája <em>{differentSemesterWarningDialogConfig.current_semester}</em> beli</p>
        </div>
        <p>Biztos hozzáadod a kurzust ehhez az órarendhez?</p>
        <div class="dialog__buttons">
            <button class="button --pulse-on-hover" onclick={
            () => {
                if(differentSemesterWarningDialogConfig){
                    saveLesson(differentSemesterWarningDialogConfig.new_lesson, false);
                }
                differentSemesterWarningDialog.close()
            }}>Hozzáadás</button>
            <button class="button --pulse-on-hover" onclick={() => differentSemesterWarningDialog.close()}>Mégsem</button>
        </div>
    {/if}
</dialog>