<script lang="ts">
	import { browser } from "$app/environment";
	import { SYMBOL_SAVED_LESSONS } from "$lib/lessons/lessonManager.svelte";
	import { type QueryData, SYMBOL_LESSONS_QUERY } from "$lib/lessons/query";
	import type { SavedLessons } from "$lib/lessons/savedLessons.svelte";
	import { getContext } from "svelte";
	import LessonsTimeTable from "./timetable/LessonsTimeTable.svelte";
    import {toPng} from "html-to-image"
    import download from 'downloadjs';
	import Tabs from "./Tabs.svelte";
	import Tooltip from "./Tooltip.svelte";
	import type { Lesson, LessonData } from "$lib/lessons/types";
	import LessonDialog from "./LessonDialog.svelte";


    let deleteTimetableDialogElement: HTMLDialogElement = $state(null!);

    let createLessonDialogOpenHandler: (defaultLesson?: Lesson) => void = $state(null!);

    let isExporting = $state(false);

    let showQueriedLessons = $state(true);

    let tableState: "default" | "drag" = $state("default");

    const savedLessons = getContext<SavedLessons>(SYMBOL_SAVED_LESSONS);

    const currentManager = $derived.by(() => browser ? savedLessons.getCurrentManager() : null);
	
	const currentSavedLessons = $derived.by(() => browser ? (currentManager?.getLessons() ?? []) : []);

    const currentSaveId = $derived(currentManager?.getSaveId() ?? "");

    const query = $derived(getContext<QueryData>(SYMBOL_LESSONS_QUERY).query);

    const queriedLessons = $derived((query?.isFetched && query.data) ? query.data : []);

    const shownQueriedLessons = $derived(showQueriedLessons ? queriedLessons : []);

    const canUndo = $derived(currentManager !== null ? currentManager.canUndo() : false);
    const canRedo = $derived(currentManager !== null ? currentManager.canRedo() : false);

    const keydownHandler = (e: KeyboardEvent) => {
        if(!e.ctrlKey){
            return;
        }

        if(e.key.toLowerCase() === "z"){
            e.preventDefault();
            currentManager?.undo();
            return;
        }

        if(e.key.toLowerCase() === "y"){
            e.preventDefault();
            currentManager?.redo();
            return;
        }
    }

    const imageExport = () => {
        isExporting = true;

        setTimeout(async () => {
            let dataUrl = await toPng(document.querySelector(`[data-lesson-timetable="${currentManager?.getSaveId()}"]`) as HTMLElement, {width: 1920});
            download(dataUrl, `${currentManager?.getSaveName()}.png`, "image/png");
            isExporting = false;
        }, 0);

    }

    const deleteSave = () => {
        deleteTimetableDialogElement.showModal();
    }

    const onTabSwitch = (id: string) => {
        const saveId = id === "add" ? savedLessons.createSave() : id;

        if(saveId){
            savedLessons.switchSave(saveId);
        }
    }

    const dragOverHandler = (e: DragEvent) => {
        e.preventDefault();

        if (e.dataTransfer){
            e.dataTransfer.dropEffect = "copy";
        }
    }

    const dropHandler = (e: DragEvent, saveId: string) => {
        e.preventDefault();

        const lesson = JSON.parse(localStorage.getItem("draggedLesson") ?? "{}") as LessonData;

        if (lesson.id){
            // console.log("adding lesson");
            const oldId = currentManager?.getSaveId() as string;

            savedLessons.switchSave(saveId);
            currentManager?.add(lesson);
            savedLessons.switchSave(oldId);
        }

        localStorage.removeItem("draggedLesson");
    }

    const handleNewLesson = () => {
        createLessonDialogOpenHandler();
    }

</script>

<svelte:window onkeydown={keydownHandler}/>

{#snippet editor(id: string)}
    <div class="editor">
        {#if !showQueriedLessons}
            <div class="icon-text --warning">
                <span class="ix--warning"></span>
                <p>A keresési találatok megjelenítése ki van kapcsolva</p>
            </div>
        {/if}

        <div class="editor__buttons">
            
            <div>
                {#if queriedLessons.length > 0}
                    <button class="icon-text button --pulse-on-hover" onclick={() => showQueriedLessons = !showQueriedLessons} disabled={isExporting}>
                        <span class={showQueriedLessons ? "ix--eye-cancelled" : "ix--eye"}></span>
                        <p>Találatok {showQueriedLessons ? "elrejtése" : "megjelenítése"}</p>
                    </button>
                {/if}
                <button class="icon-text button --pulse-on-hover" onclick={imageExport} disabled={isExporting}>
                    <span class={isExporting ? "ix--draw-circle-arc --spinning" : "ix--image"}></span>
                    <p>Mentés képként</p>
                </button>
                <button class="icon-text button --pulse-on-hover" onclick={handleNewLesson} disabled={isExporting}>
                    <span class="ix--add-document-note"></span>
                    <p>Saját óra hozzáadása</p>
                </button>
            </div>

            <div>
                <Tooltip content="Visszavonás">
                    <button aria-label="visszavonás" class="button button--icon --pulse-on-hover --fs-h5" disabled={!canUndo || isExporting} onclick={() => currentManager?.undo()}>
                        <div class="ix--undo"></div>
                    </button>
                </Tooltip>
                <Tooltip content="Újracsinálás">
                    <button aria-label="újracsinálás" class="button button--icon --pulse-on-hover --fs-h5" disabled={!canRedo || isExporting} onclick={() => currentManager?.redo()}>
                        <div class="ix--redo"></div>
                    </button>
                </Tooltip>
            </div>
        </div>
        {#if id === currentSaveId}
            <div class="editor__timetable-wrapper {isExporting ? "editor__timetable-wrapper--exporting" : ""}">
                <LessonsTimeTable queriedLessons={shownQueriedLessons} ownLessons={currentSavedLessons} bind:tableState={tableState} imageMode={isExporting} timetableId={id}/>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet tabValue(id: string)}
    {#if id === "add"}
            <Tooltip content="Új órarend készítése" config={{openDelay: 500}}>
                {#if savedLessons.getMaxSaveCount() !== savedLessons.getSaveIds().length}
                    <div class="icon --fs-h4 ix--add-circle">
                    </div>
                {:else}
                    <p class="--warning">Maximum órarendszám elérve</p>
                {/if}
            </Tooltip>
        
    {:else if id === currentSaveId}
        <div class="editor__active-tab">
            <div class="--typewrite">
                <input class="text-input text-input--small editor__text-input"
                    type="text"
                    name="saveName"
                    contenteditable="true"
                    defaultValue={currentManager?.getSaveName()}
                    onchange={e => currentManager?.setSaveName(e.currentTarget.value)}
                    disabled={isExporting}
                />
            </div>
            {#if savedLessons.getSaveIds().length > 1 }
                <Tooltip content="Órarend törlése">
                    <button class="button button--icon --pulse-on-hover --error" aria-label="Órarend törlése" onclick={deleteSave} disabled={isExporting}>
                        <div class="ix--trashcan"></div>
                    </button>
                </Tooltip>
            {/if}
        </div>
    {:else}
        <Tooltip 
            content="Dobd ide az órát a másoláshoz" 
            triggerType="dragover" 
            config={{openDelay: 0, floatingConfig: {computePosition: {placement: "top"}}}}
        >
            <p 
                class={tableState === "drag" ? "--pulse": ""}
                ondragover={tableState === "drag" ? dragOverHandler: undefined}
                ondrop={tableState === "drag" ? e => dropHandler(e, id) : undefined}
            >
                {savedLessons.getSaveNameForId(id)}
            </p>
        </Tooltip>
    {/if}
{/snippet}

<Tabs 
    tabContent={tabValue} 
    tabIdValue={() => currentSaveId} 
    selectedContent={editor} 
    tabIds={[...savedLessons.getSaveIds(), "add"]}
    onTabChange={onTabSwitch}
/>

<dialog
    class="dialog"
    bind:this={deleteTimetableDialogElement}
>
    <p class="--fs-h5">Biztosan törlöd "{currentManager?.getSaveName()}" nevű órarendedet?</p>
    <div class="icon-text --warning">
        <span class="ix--warning"></span>
        <p>Ez a művelet nem visszavonható</p>
    </div>
    <div class="dialog__buttons">
        <button class="button --pulse-on-hover --error" onclick={() => {deleteTimetableDialogElement.close(); savedLessons.removeSave(currentSaveId)}}>Törlés</button>
        <button class="button --pulse-on-hover" onclick={() => deleteTimetableDialogElement.close()}>Mégsem</button>
    </div>
</dialog>

<LessonDialog bind:dialogOpenHandler={createLessonDialogOpenHandler} onSave={data => currentManager?.add(data)} title="Saját óra hozzáadása"/>