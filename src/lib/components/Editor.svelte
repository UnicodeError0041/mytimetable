<script lang="ts">
	import { browser } from "$app/environment";
	import { SYMBOL_OPEN_OPERATION_WARNING_MODAL, SYMBOL_SAVED_LESSONS } from "$lib/lessons/lessonManager.svelte";
	import { type QueryData, SYMBOL_LESSONS_QUERY } from "$lib/lessons/query";
	import type { LessonSave, SavedLessons } from "$lib/lessons/savedLessons.svelte";
	import { getContext, setContext } from "svelte";
	import LessonsTimeTable from "./timetable/LessonsTimeTable.svelte";
    import {toPng} from "html-to-image"
    import download from 'downloadjs';
	import Tabs from "./Tabs.svelte";
	import Tooltip from "./Tooltip.svelte";
	import type { Lesson, LessonData } from "$lib/lessons/types";
	import LessonDialog from "./LessonDialog.svelte";
	import { encodeURI } from "$lib/lessons/encode";
	import Combobox from "./inputs/Combobox.svelte";


    let deleteTimetableDialogElement: HTMLDialogElement = $state(null!);
    let operationWarningDialogElement: HTMLDialogElement = $state(null!);
    let urlExportDialogElement: HTMLDialogElement = $state(null!);
    let copyTimetableDialogElement: HTMLDialogElement = $state(null!);

    let exportUrl = $state("");

    let createLessonDialogOpenHandler: (defaultLesson?: Lesson) => void = $state(null!);

    let isImageExporting = $state(false);
    let isURLExporting = $state(false);

    let isExportDone = $state(false);

    const isExporting = $derived(isImageExporting || isURLExporting);

    let showQueriedLessons = $state(true);

    let tableState: "default" | "drag" = $state("default");

    let droppedSaveId: string | null = $state(null);
    let timetableCopyTargetId: string = $state("");

    const savedLessons = getContext<SavedLessons>(SYMBOL_SAVED_LESSONS);

    const currentManager = $derived.by(() => browser ? savedLessons.getCurrentManager() : null);
	
	const currentSavedLessons = $derived.by(() => browser ? (currentManager?.getLessons() ?? []) : []);

    const currentSaveId = $derived(currentManager?.getSaveId() ?? "");

    const queriedLessons = $derived(getContext<QueryData>(SYMBOL_LESSONS_QUERY).queriedLessons ?? []);

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
        isImageExporting = true;

        setTimeout(async () => {
            let dataUrl = await toPng(document.querySelector(`[data-lesson-timetable="${currentManager?.getSaveId()}"]`) as HTMLElement, {width: 1920, skipFonts: true});
            download(dataUrl, `${currentManager?.getSaveName()}.png`, "image/png");
            isExportDone = true;

            setTimeout(() => {isExportDone = false; isImageExporting = false;}, 1000);
        }, 0);

    }

    const URLExport = () => {
        isURLExporting = true;

        setTimeout(async () => {
            const url = new URL(window.location.toString());

            url.searchParams.delete('data');
            url.searchParams.append('data', encodeURI(currentManager?.getLessonSave() as LessonSave));

            exportUrl = `Helló! Nézd meg a ${currentManager?.getSaveName()} órarendemet itt: ${url.toString()}`;

            urlExportDialogElement.showModal();

            isExportDone = true;
            
            setTimeout(() => {isExportDone = false; isURLExporting = false;}, 1000);
        }, 0);
    }

    const openDeleteSaveModal = () => {
        deleteTimetableDialogElement.showModal();
    }

    const openCopyTimetableModal = () => {
        copyTimetableDialogElement.showModal();
    }

    const openOperationWarningModal = () => {
        operationWarningDialogElement.showModal();
    }

    setContext(SYMBOL_OPEN_OPERATION_WARNING_MODAL, openOperationWarningModal);

    const copyTimetable = () => {
        if(timetableCopyTargetId === "done" || timetableCopyTargetId === "") {
            return;
        }

        const ogId = currentManager?.getSaveId() as string;
        const ogLessons = currentManager?.getLessons() ?? [];

        savedLessons.switchSave(timetableCopyTargetId);

        for(const lesson of ogLessons){
            currentManager?.add(lesson);
        }
        savedLessons.switchSave(ogId);

        timetableCopyTargetId = "done";

        setTimeout(() => {
            timetableCopyTargetId = "";
            copyTimetableDialogElement.close();
        }, 1000);
    }

    const onTabSwitch = (id: string) => {
        const saveId = id === "add" ? savedLessons.createSave() : id;

        if (saveId === false){
            openOperationWarningModal();
            return;
        }
        
        savedLessons.switchSave(saveId);
    
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
            if(!currentManager?.add(lesson)){
                openOperationWarningModal();
            };
            savedLessons.switchSave(oldId);

            droppedSaveId = saveId;
            setTimeout(() => droppedSaveId = null, 1000);
        }

        localStorage.removeItem("draggedLesson");
    }

    const handleNewLessonDialog = () => {
        createLessonDialogOpenHandler();
    }
    const handleNewLesson = (data: LessonData) => {
        if(!currentManager?.add(data)){
            openOperationWarningModal();
        }
    }

    const handleUndo = () => {
        if(!currentManager?.undo()){
            openOperationWarningModal();
        }
    }

    const handleRedo = () => {
        if(!currentManager?.redo()){
            openOperationWarningModal();
        }
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

                {#if currentSavedLessons.length !== 0}
                    <button class="icon-text button --pulse-on-hover" onclick={imageExport} disabled={isExporting}>
                        <span class={isImageExporting ? isExportDone ? "ix--single-check --bounce-in" : "ix--draw-circle-arc --spinning" : "ix--image"}></span>
                        <p>Exportálás képként</p>
                    </button>
                    <button class="icon-text button --pulse-on-hover" onclick={URLExport} disabled={isExporting}>
                        <span class={isURLExporting ? isExportDone ? "ix--single-check --bounce-in" : "ix--draw-circle-arc --spinning" : "ix--link"}></span>
                        <p>
                            {#if isExportDone}
                                URL legenerálva
                            {:else}
                                Exportálás URL-ként
                            {/if}
                        </p>
                    </button>
                {/if}
                <button class="icon-text button --pulse-on-hover" onclick={handleNewLessonDialog} disabled={isExporting}>
                    <span class="ix--add-document-note"></span>
                    <p>Saját óra hozzáadása</p>
                </button>
            </div>

            <div>
                <Tooltip content="Visszavonás">
                    <button aria-label="visszavonás" class="button button--icon --pulse-on-hover --fs-h5" disabled={!canUndo || isImageExporting} onclick={handleUndo}>
                        <div class="ix--undo"></div>
                    </button>
                </Tooltip>
                <Tooltip content="Újracsinálás">
                    <button aria-label="újracsinálás" class="button button--icon --pulse-on-hover --fs-h5" disabled={!canRedo || isImageExporting} onclick={handleRedo}>
                        <div class="ix--redo"></div>
                    </button>
                </Tooltip>
            </div>
        </div>
        {#if id === currentSaveId}
            <div class="editor__timetable-wrapper {isImageExporting ? "editor__timetable-wrapper--exporting" : ""}">
                <LessonsTimeTable queriedLessons={shownQueriedLessons} ownLessons={currentSavedLessons} bind:tableState={tableState} imageMode={isImageExporting} timetableId={id}/>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet tabValue(id: string)}
    {#if id === "add"}
            <Tooltip content="Új órarend készítése" config={{openDelay: 300}}>
                <div class="editor__inactive-tab">
                    {#if savedLessons.getMaxSaveCount() !== savedLessons.getSaveIds().length}
                        <div class="icon --fs-h4 ix--add-circle">
                        </div>
                    {:else}
                        <p class="--warning">Maximum órarendszám elérve</p>
                    {/if}
                </div>
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
                    disabled={isImageExporting}
                    onkeydown={e => e.stopPropagation()}
                />
            </div>
            {#if savedLessons.getSaveIds().length > 1 }
                <Tooltip content="Órarend óráinak átmásolása másik órarendbe" classes="editor__active-tab-button-holder">
                    <button class="button button--icon --pulse-on-hover" aria-label="Órarend óráinak átmásolása másik órarendbe" onclick={openCopyTimetableModal} disabled={isImageExporting}>
                        <div class="ix--export"></div>
                    </button>
                </Tooltip>

                <Tooltip content="Órarend törlése" classes="editor__active-tab-button-holder">
                    <button class="button button--icon --pulse-on-hover --error" aria-label="Órarend törlése" onclick={openDeleteSaveModal} disabled={isImageExporting}>
                        <div class="ix--trashcan"></div>
                    </button>
                </Tooltip>
            {/if}
        </div>
    {:else}
        {@const isDragging = tableState === "drag"}
        {@const showIcon = droppedSaveId == id || isDragging}
        <Tooltip 
            content="Dobd ide az órát az átmásoláshoz" 
            triggerType="dragover"
            classes="tooltip-trigger--ful-size" 
            config={{floatingConfig: {computePosition: {placement: "top"}}}}
        >
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
                class="editor__inactive-tab {showIcon ? "icon-text" : ""} {isDragging ? "--pulse": ""}"
                ondragover={isDragging ? dragOverHandler: undefined}
                ondrop={isDragging ? e => dropHandler(e, id) : undefined}
            >
                {#if showIcon}
                    <span class="{isDragging ? "ix--import" :"ix--single-check --bounce-in"} icon --fs-h5"></span>
                {/if}
                <p>{savedLessons.getSaveNameForId(id)}</p>
            </div>
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
        <button class="button --pulse-on-hover --error" onclick={() => {deleteTimetableDialogElement.close(); if(!savedLessons.removeSave(currentSaveId)){openOperationWarningModal();}}}>Törlés</button>
        <button class="button --pulse-on-hover" onclick={() => deleteTimetableDialogElement.close()}>Mégsem</button>
    </div>
</dialog>

<dialog
    class="dialog"
    bind:this={operationWarningDialogElement}
>
    <p class="--fs-h5">Hiba művelet végrehajtása közben</p>
    <div class="icon-text --error">
        <span class="ix--warning-rhomb"></span>
        <p>Ez a művelet nem végrehajtható</p>
    </div>
    <p>Ez előfordulhat akkor, ha egyszerre több lapon szerkesztesz órarendet. Töltsd újra az oldalt, hogy a legfrissebb órarendjeidet lásd!</p>
    <div class="dialog__buttons">
        <button class="button --pulse-on-hover" onclick={() => operationWarningDialogElement.close()}>Bezárás</button>
    </div>
</dialog>

<dialog
    class="dialog"
    bind:this={copyTimetableDialogElement}
>
    <p class="--fs-h5">"{currentManager?.getSaveName()}" órarend óráinak átmásolása</p>
    <Combobox label="Cél órarend" options={savedLessons.getSaveIds().filter(id => id !== currentManager?.getSaveId())} optionText={(id) => savedLessons.getSaveNameForId(id) ?? ""} bind:selected={timetableCopyTargetId}/>
    <div class="dialog__buttons">
         <button class="button icon-text button--primary-filled --pulse-on-hover" disabled={timetableCopyTargetId === ""} onclick={copyTimetable}>
            <span class={timetableCopyTargetId === "done" ? "ix--single-check --bounce-in" : "ix--export"}></span>
            <p>Átmásolás</p>
        </button>
        <button class="button --pulse-on-hover" onclick={() => {copyTimetableDialogElement.close(); timetableCopyTargetId = ""}}>Mégsem</button>
    </div>
</dialog>

<dialog
    class="dialog"
    bind:this={urlExportDialogElement}
>
    <p class="--fs-h5">A "{currentManager?.getSaveName()}" nevű órarendhez generált URL:</p>
    <p class="url">
        {exportUrl}
    </p>
    <div class="dialog__buttons">
        <button class="button icon-text button--primary-filled --pulse-on-hover" onclick={() => {urlExportDialogElement.close(); navigator.clipboard.writeText(exportUrl);}}>
            <span class="ix--copy"></span>
            <p>Másolás</p>
        </button>
        <button class="button --pulse-on-hover" onclick={() => urlExportDialogElement.close()}>Vissza</button>
    </div>
</dialog>

<LessonDialog bind:dialogOpenHandler={createLessonDialogOpenHandler} onSave={handleNewLesson} title="Saját óra hozzáadása"/>