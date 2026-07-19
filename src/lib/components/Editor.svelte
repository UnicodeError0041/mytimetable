<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import {
		SYMBOL_OPEN_LESSON_EXPORT_MODAL as SYMBOL_OPEN_LESSON_COPY_MODAL,
		SYMBOL_OPEN_OPERATION_WARNING_MODAL,
		SYMBOL_SAVED_LESSONS
	} from '$lib/lessons/lessonManager.svelte';
	import { type QueryData, SYMBOL_LESSONS_QUERY } from '$lib/lessons/query';
	import type { LessonSave, SavedLessons } from '$lib/lessons/savedLessons.svelte';
	import { getContext, setContext } from 'svelte';
	import LessonsTimeTable from './timetable/LessonsTimeTable.svelte';
	import { toPng } from 'html-to-image';
	import download from 'downloadjs';
	import Tabs from './Tabs.svelte';
	import Tooltip from './Tooltip.svelte';
	import type { Lesson, LessonData } from '$lib/lessons/types';
	import LessonDialog from './LessonDialog.svelte';
	import { encodeURI } from '$lib/lessons/encode';
	import Combobox from './inputs/Combobox.svelte';
	import {
		createBadAppleLessonManager,
		type BadAppleLessonManager
	} from '$lib/lessons/badAppleLessonManager.svelte';
	import DismissibleAlert from './DismissibleAlert.svelte';

	let deleteTimetableDialogElement: HTMLDialogElement = $state(null!);
	let operationWarningDialogElement: HTMLDialogElement = $state(null!);
	let urlExportDialogElement: HTMLDialogElement = $state(null!);
	let copyTimetableDialogElement: HTMLDialogElement = $state(null!);

	let exportUrl = $state('');

	let createLessonDialogOpenHandler: (defaultLesson?: Lesson) => void = $state(null!);

	let isImageExporting = $state(false);
	let isURLExporting = $state(false);

	let isExportDone = $state(false);

	const isExporting = $derived(isImageExporting || isURLExporting);

	let showQueriedLessons = $state(true);

	let tableState: 'default' | 'drag' = $state('default');

	let droppedSaveId: string | null = $state(null);
	let timetableCopyTargetId: string = $state('');
	let lessonsToCopy: LessonData[] = $state([]);

	const savedLessons = getContext<SavedLessons>(SYMBOL_SAVED_LESSONS);

	const currentManager = $derived.by(() => (browser ? savedLessons.getCurrentManager() : null));

	const currentSavedLessons = $derived.by(() =>
		browser ? (currentManager?.getLessons() ?? []) : []
	);

	const currentSaveId = $derived(currentManager?.getSaveId() ?? '');

	const tabIds = $derived.by(() => {
		let returned = [];

		for (let i = 0; i < savedLessons.getSaveIds().length; i++) {
			returned[i] = '' + i;
		}
		return returned;
	});

	const queriedLessons = $derived(getContext<QueryData>(SYMBOL_LESSONS_QUERY).queriedLessons ?? []);

	const shownQueriedLessons = $derived(showQueriedLessons ? queriedLessons : []);

	const canUndo = $derived(currentManager !== null ? currentManager.canUndo() : false);
	const canRedo = $derived(currentManager !== null ? currentManager.canRedo() : false);

	let badAppleManager: BadAppleLessonManager = $state(undefined!);

	const badAppleLessons: LessonData[] = $derived(
		badAppleManager === undefined ? [] : badAppleManager.getLessons()
	);

	let audioPlayer: HTMLAudioElement = $state(null!);

	// let audioPromise: Promise<void> = null!
	// if(browser){
	//     audioPromise = new Promise<void>((resolve, reject) => {
	//         audioPlayer.addEventListener("canplay", e => {
	//             resolve();
	//         })
	//     }
	// );
	// }

	const handleBadAppleClick = async () => {
		if (!badAppleManager) {
			badAppleManager = createBadAppleLessonManager();
			await badAppleManager.loadingPromise();
		}

		if (audioPlayer.readyState != 4) {
			console.log('waiting for audio');
			const audioPromise = new Promise<void>((resolve, reject) => {
				audioPlayer.addEventListener('canplay', (e) => {
					resolve();
				});
			});
			await audioPromise;
		}

		if (badAppleManager.isPlaying()) {
			badAppleManager.cancel();
			audioPlayer.pause();
			audioPlayer.currentTime = 0;
			audioPlayer.pause();
		} else {
			badAppleManager.start();
			audioPlayer.play();
		}
	};

	let draggedTabId: string | null = $state(null);

	let cantDragTab: boolean = $state(true);

	const keydownHandler = (e: KeyboardEvent) => {
		if (!e.ctrlKey) {
			return;
		}

		if (e.key.toLowerCase() === 'z') {
			e.preventDefault();
			currentManager?.undo();
			return;
		}

		if (e.key.toLowerCase() === 'y') {
			e.preventDefault();
			currentManager?.redo();
			return;
		}
	};

	const imageExport = () => {
		isImageExporting = true;

		setTimeout(async () => {
			let dataUrl = await toPng(
				document.querySelector(
					`[data-lesson-timetable="${currentManager?.getSaveId()}"]`
				) as HTMLElement,
				{ width: 1920, skipFonts: true }
			);
			download(dataUrl, `${currentManager?.getSaveName()}.png`, 'image/png');
			isExportDone = true;

			setTimeout(() => {
				isExportDone = false;
				isImageExporting = false;
			}, 1000);
		}, 0);
	};

	const URLExport = () => {
		isURLExporting = true;

		setTimeout(async () => {
			const url = new URL(window.location.toString());

			url.searchParams.delete('data');
			url.searchParams.append('data', encodeURI(currentManager?.getLessonSave() as LessonSave));

			exportUrl = `${url.toString()}`;

			urlExportDialogElement.showModal();

			isExportDone = true;

			setTimeout(() => {
				isExportDone = false;
				isURLExporting = false;
			}, 1000);
		}, 0);
	};

	const openDeleteSaveModal = () => {
		deleteTimetableDialogElement.showModal();
	};

	const openCopyTimetableModal = () => {
		lessonsToCopy = currentManager?.getLessons() ?? [];
		copyTimetableDialogElement.showModal();
	};

	const openCopyLessonsModal = (lessons: LessonData[]) => {
		lessonsToCopy = lessons;
		copyTimetableDialogElement.showModal();
	};

	const openOperationWarningModal = () => {
		operationWarningDialogElement.showModal();
	};

	setContext(SYMBOL_OPEN_OPERATION_WARNING_MODAL, openOperationWarningModal);
	setContext(SYMBOL_OPEN_LESSON_COPY_MODAL, openCopyLessonsModal);

	const copyTimetable = () => {
		if (timetableCopyTargetId === 'done' || timetableCopyTargetId === '') {
			return;
		}

		const ogId = currentManager?.getSaveId() as string;

		savedLessons.switchSave(timetableCopyTargetId);

		let success = currentManager?.startBatch();

		for (const lesson of lessonsToCopy) {
			success &&= currentManager?.add(lesson);
		}

		success &&= currentManager?.endBatch();

		savedLessons.switchSave(ogId);

		if (!success) {
			timetableCopyTargetId = '';
			copyTimetableDialogElement.close();
			openOperationWarningModal();
			return;
		}

		timetableCopyTargetId = 'done';
		setTimeout(() => {
			timetableCopyTargetId = '';
			copyTimetableDialogElement.close();
		}, 1000);
	};

	const duplicateTimetable = () => {
		savedLessons.createSave(
			`${currentManager?.getSaveName()} (${m.this_is_a_copy()})`,
			$state.snapshot(currentManager?.getLessons())
		);

		timetableCopyTargetId = 'done';
		setTimeout(() => {
			timetableCopyTargetId = '';
		}, 1000);
	};

	const onTabSwitch = (id: string) => {
		const saveId = id === 'add' ? savedLessons.createSave() : savedLessons.getSaveIds()[Number(id)];

		if (saveId === false) {
			openOperationWarningModal();
			return;
		}

		savedLessons.switchSave(saveId);
	};

	const lessonDragOverHandler = (e: DragEvent) => {
		e.preventDefault();

		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}
	};

	const lessonDropHandler = (e: DragEvent, saveId: string) => {
		e.preventDefault();

		const lesson = JSON.parse(localStorage.getItem('draggedLesson') ?? '{}') as LessonData;

		if (lesson.id) {
			// console.log("adding lesson");
			const oldId = currentManager?.getSaveId() as string;

			savedLessons.switchSave(saveId);
			if (!currentManager?.add(lesson)) {
				openOperationWarningModal();
			}
			savedLessons.switchSave(oldId);

			droppedSaveId = saveId;
			setTimeout(() => (droppedSaveId = null), 1000);
		}

		localStorage.removeItem('draggedLesson');
	};

	const tabDragOverHandler = (e: DragEvent) => {
		e.preventDefault();

		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	};

	const tabDropHandler = (e: DragEvent, saveId: string) => {
		e.preventDefault();

		if (draggedTabId === null) {
			return;
		}

		const saveIds = savedLessons.getSaveIds();

		const idx = saveId === 'add' ? saveIds.length - 1 : saveIds.indexOf(saveId);

		savedLessons.moveSave(draggedTabId, idx);

		draggedTabId = null;
	};

	const tabDragStartHandler = (e: DragEvent, saveId: string) => {
		if (e.dataTransfer != null) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.dropEffect = 'none';
		}

		draggedTabId = saveId;
	};

	const tabDragEndHandler = (e: DragEvent) => {
		e.preventDefault();

		if (e.dataTransfer != null) {
			draggedTabId = null;
		}
	};

	const handleNewLessonDialog = () => {
		createLessonDialogOpenHandler();
	};
	const handleNewLesson = (data: LessonData) => {
		if (!currentManager?.add(data)) {
			openOperationWarningModal();
		}
	};

	const handleUndo = () => {
		if (!currentManager?.undo()) {
			openOperationWarningModal();
		}
	};

	const handleRedo = () => {
		if (!currentManager?.redo()) {
			openOperationWarningModal();
		}
	};
</script>

<svelte:window onkeydown={keydownHandler} />

{#snippet editor(tabId: string)}
	{@const id = savedLessons.getSaveIds()[Number(tabId)]}
	{@const isBadApple = savedLessons.getSaveNameForId(id)?.toLowerCase().trim() == 'bad apple'}

	<div class="editor">
		{#if !showQueriedLessons}
			<DismissibleAlert localStorageKey="hidden_search_results">
				<p>{m.hidden_results()}</p>
			</DismissibleAlert>
		{/if}

		<div class="editor__buttons">
			<div>
				{#if isBadApple}
					<Tooltip content={badAppleManager?.isPlaying() ? m.lesson_stop() : m.lesson_play()}>
						<button
							aria-label={badAppleManager?.isPlaying() ? m.lesson_stop() : m.lesson_play()}
							class="icon-text button --pulse-on-hover"
							onclick={handleBadAppleClick}
							disabled={badAppleManager !== undefined && badAppleManager.isLoading()}
						>
							<div
								class={badAppleManager?.isPlaying()
									? 'ix--stop'
									: badAppleManager?.isLoading()
										? 'ix--draw-circle-arc --spinning'
										: 'ix--play'}
							></div>
						</button>
					</Tooltip>

					<!-- <Tooltip content={"Megállítás"}>
                        <button aria-label={"megállítás"} class="icon-text button --pulse-on-hover" 
                            onclick={() => badAppleManager.pause()}
                            disabled={badAppleManager !== undefined && badAppleManager.isLoading()}
                        >
                            <span class="ix--play"></span>
                            <p>Stop</p>
                        </button>
                    </Tooltip>

                    <Tooltip content={"Kövi képkocka"}>
                        <button aria-label={"Kövi képkocka"} class="icon-text button --pulse-on-hover" 
                            onclick={() => badAppleManager.nextFrame()}
                            disabled={badAppleManager !== undefined && badAppleManager.isLoading()}
                        >
                            <span class="ix--play"></span>
                            <p>Kövi képkocka</p>
                        </button>
                    </Tooltip>

                    <Tooltip content={"Előző képkocka"}>
                        <button aria-label={"Előző képkocka"} class="icon-text button --pulse-on-hover" 
                            onclick={() => badAppleManager.prevFrame()}
                            disabled={badAppleManager !== undefined && badAppleManager.isLoading()}
                        >
                            <span class="ix--play"></span>
                            <p>Előző képkocka</p>
                        </button>
                    </Tooltip> -->
				{/if}

				{#if queriedLessons.length > 0}
					<button
						class="icon-text button --pulse-on-hover"
						onclick={() => (showQueriedLessons = !showQueriedLessons)}
						disabled={isExporting}
					>
						<span class={showQueriedLessons ? 'ix--eye-cancelled' : 'ix--eye'}></span>
						<p>{showQueriedLessons ? m.hide_results() : m.show_results()}</p>
					</button>
				{/if}

				{#if currentSavedLessons.length !== 0}
					<button
						class="icon-text button --pulse-on-hover"
						onclick={imageExport}
						disabled={isExporting}
					>
						<span
							class={isImageExporting
								? isExportDone
									? 'ix--single-check --bounce-in'
									: 'ix--draw-circle-arc --spinning'
								: 'ix--image'}
						></span>
						<p>{m.export_as_image()}</p>
					</button>
					<button
						class="icon-text button --pulse-on-hover"
						onclick={URLExport}
						disabled={isExporting}
					>
						<span
							class={isURLExporting
								? isExportDone
									? 'ix--single-check --bounce-in'
									: 'ix--draw-circle-arc --spinning'
								: 'ix--link'}
						></span>
						<p>
							{#if isExportDone && isURLExporting}
								{m.export_url_generated()}
							{:else}
								{m.export_as_url()}
							{/if}
						</p>
					</button>
				{/if}
				<button
					class="icon-text button --pulse-on-hover"
					onclick={handleNewLessonDialog}
					disabled={isExporting}
				>
					<span class="ix--add-document-note"></span>
					<p>{m.add_own_lesson()}</p>
				</button>
			</div>

			<div class="editor__undo-redo-buttons">
				<Tooltip content={m.undo()}>
					<button
						aria-label={m.undo()}
						class="button button--icon --pulse-on-hover --fs-h5"
						disabled={!canUndo || isImageExporting}
						onclick={handleUndo}
					>
						<div class="ix--undo"></div>
					</button>
				</Tooltip>
				<Tooltip content={m.redo()}>
					<button
						aria-label={m.redo()}
						class="button button--icon --pulse-on-hover --fs-h5"
						disabled={!canRedo || isImageExporting}
						onclick={handleRedo}
					>
						<div class="ix--redo"></div>
					</button>
				</Tooltip>
			</div>
		</div>
		{#if id === currentSaveId}
			<div
				class="editor__timetable-wrapper {isImageExporting
					? 'editor__timetable-wrapper--exporting'
					: ''}"
			>
				<LessonsTimeTable
					queriedLessons={isBadApple && badAppleManager?.isPlaying() ? [] : shownQueriedLessons}
					ownLessons={isBadApple && badAppleManager?.isPlaying()
						? badAppleLessons
						: currentSavedLessons}
					bind:tableState
					imageMode={isImageExporting}
					timetableId={id}
					viewOnly={isBadApple && badAppleManager?.isPlaying()}
				/>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet tabValue(id: string)}
	{@const saveId = savedLessons.getSaveIds()[Number(id)]}

	{#if id === 'add'}
		<Tooltip content={m.create_new_timetable()} config={{ openDelay: 300 }}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="editor__inactive-tab">
				{#if savedLessons.getMaxSaveCount() !== savedLessons.getSaveIds().length}
					<div class="icon --fs-h4 ix--add-circle"></div>
				{:else}
					<p class="--warning">{m.create_new_timetable_max_reached()}</p>
				{/if}
			</div>
		</Tooltip>
	{:else if saveId === currentSaveId}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="editor__active-tab"
			draggable={!cantDragTab}
			ondragstart={(e) => tabDragStartHandler(e, saveId)}
			ondragend={tabDragEndHandler}
			ondragover={tabDragOverHandler}
			ondrop={(e) => tabDropHandler(e, saveId)}
		>
			<div class="--typewrite">
				<input
					class="text-input text-input--small editor__text-input"
					type="text"
					name="saveName"
					contenteditable="true"
					defaultValue={currentManager?.getSaveName()}
					onchange={(e) => currentManager?.setSaveName(e.currentTarget.value)}
					disabled={isImageExporting}
					onkeydown={(e) => e.stopPropagation()}
					bind:focused={cantDragTab}
				/>
			</div>
			{#if savedLessons.getSaveIds().length > 1}
				<div class="editor__active-tab-buttons">
					<Tooltip content={m.copy_timetable()} classes="editor__active-tab-button-holder">
						<button
							class="button button--icon --pulse-on-hover"
							aria-label={m.copy_timetable()}
							onclick={openCopyTimetableModal}
							disabled={isImageExporting}
						>
							<div class="ix--export"></div>
						</button>
					</Tooltip>
					<Tooltip content={m.duplicate_timetable()} classes="editor__active-tab-button-holder">
						<button
							class="button button--icon --pulse-on-hover"
							aria-label={m.duplicate_timetable()}
							onclick={duplicateTimetable}
							disabled={isImageExporting}
						>
							<div
								class={timetableCopyTargetId == 'done' ? 'ix--single-check' : 'ix--duplicate'}
							></div>
						</button>
					</Tooltip>
					<Tooltip content={m.delete_timetable()} classes="editor__active-tab-button-holder">
						<button
							class="button button--icon --pulse-on-hover --error"
							aria-label={m.delete_timetable()}
							onclick={openDeleteSaveModal}
							disabled={isImageExporting}
						>
							<div class="ix--trashcan"></div>
						</button>
					</Tooltip>
				</div>
			{:else}
				<div>
					<Tooltip content={m.duplicate_timetable()} classes="editor__active-tab-button-holder">
						<button
							class="button button--icon --pulse-on-hover"
							aria-label={m.duplicate_timetable()}
							onclick={duplicateTimetable}
							disabled={isImageExporting}
						>
							<div
								class={timetableCopyTargetId == 'done' ? 'ix--single-check' : 'ix--duplicate'}
							></div>
						</button>
					</Tooltip>
				</div>
			{/if}
		</div>
	{:else}
		{@const isDraggingLesson = tableState === 'drag'}
		{@const showIcon = droppedSaveId == saveId || isDraggingLesson}
		<Tooltip
			content={m.drop_lesson_here()}
			triggerType={isDraggingLesson ? 'dragover' : 'none'}
			classes="tooltip-trigger--ful-size"
			config={{ floatingConfig: { computePosition: { placement: 'top' } } }}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="editor__inactive-tab {showIcon ? 'icon-text' : ''} {isDraggingLesson
					? '--pulse'
					: ''}"
				draggable="true"
				ondragstart={(e) => tabDragStartHandler(e, saveId)}
				ondragend={tabDragEndHandler}
				ondragover={isDraggingLesson ? lessonDragOverHandler : tabDragOverHandler}
				ondrop={isDraggingLesson
					? (e) => lessonDropHandler(e, saveId)
					: (e) => tabDropHandler(e, saveId)}
			>
				{#if showIcon}
					<span
						class="{isDraggingLesson ? 'ix--import' : 'ix--single-check --bounce-in'} icon --fs-h5"
					></span>
				{/if}
				<p>{savedLessons.getSaveNameForId(saveId)}</p>
			</div>
		</Tooltip>
	{/if}
{/snippet}

<Tabs
	tabContent={tabValue}
	tabIdValue={() => '' + savedLessons.getSaveIds().indexOf(currentSaveId)}
	selectedContent={editor}
	tabIds={[...tabIds, 'add']}
	onTabChange={onTabSwitch}
/>

<dialog class="dialog" bind:this={deleteTimetableDialogElement}>
	<p class="--fs-h5">
		{m.delete_timetable_dialog_title({ name: currentManager?.getSaveName() ?? '' })}
	</p>
	<div class="icon-text --warning">
		<span class="ix--warning"></span>
		<p>{m.delete_timetable_warning()}</p>
	</div>
	<div class="dialog__buttons">
		<button
			class="button --pulse-on-hover --error"
			onclick={() => {
				deleteTimetableDialogElement.close();
				if (!savedLessons.removeSave(currentSaveId)) {
					openOperationWarningModal();
				}
			}}>{m.delete_timetable_action()}</button
		>
		<button class="button --pulse-on-hover" onclick={() => deleteTimetableDialogElement.close()}
			>{m.lesson_cancel()}</button
		>
	</div>
</dialog>

<dialog class="dialog" bind:this={operationWarningDialogElement}>
	<p class="--fs-h5">{m.operation_warning_title()}</p>
	<div class="icon-text --error">
		<span class="ix--warning-rhomb"></span>
		<p>{m.operation_warning_body()}</p>
	</div>
	<p>
		{m.operation_warning_detail()}
	</p>
	<div class="dialog__buttons">
		<button class="button --pulse-on-hover" onclick={() => operationWarningDialogElement.close()}
			>{m.close()}</button
		>
	</div>
</dialog>

<dialog class="dialog" bind:this={copyTimetableDialogElement}>
	<p class="--fs-h5">
		{m.copy_timetable_dialog_title({ name: currentManager?.getSaveName() ?? '' })}
	</p>
	<Combobox
		label={m.target_timetable()}
		options={savedLessons.getSaveIds().filter((id) => id !== currentManager?.getSaveId())}
		optionText={(id) => savedLessons.getSaveNameForId(id) ?? ''}
		bind:selected={timetableCopyTargetId}
	/>
	<div class="dialog__buttons">
		<button
			class="button icon-text button--primary-filled --pulse-on-hover"
			disabled={timetableCopyTargetId === ''}
			onclick={copyTimetable}
		>
			<span class={timetableCopyTargetId === 'done' ? 'ix--single-check --bounce-in' : 'ix--export'}
			></span>
			<p>{m.copy()}</p>
		</button>
		<button
			class="button --pulse-on-hover"
			onclick={() => {
				copyTimetableDialogElement.close();
				timetableCopyTargetId = '';
			}}>{m.lesson_cancel()}</button
		>
	</div>
</dialog>

<dialog class="dialog" bind:this={urlExportDialogElement}>
	<p class="--fs-h5">{m.generated_url_title({ name: currentManager?.getSaveName() ?? '' })}</p>
	<p class="url">
		{exportUrl}
	</p>
	<div class="dialog__buttons">
		<button
			class="button icon-text button--primary-filled --pulse-on-hover"
			onclick={() => {
				urlExportDialogElement.close();
				navigator.clipboard.writeText(exportUrl);
			}}
		>
			<span class="ix--copy"></span>
			<p>{m.copy()}</p>
		</button>
		<button class="button --pulse-on-hover" onclick={() => urlExportDialogElement.close()}
			>{m.back()}</button
		>
	</div>
</dialog>

<LessonDialog
	bind:dialogOpenHandler={createLessonDialogOpenHandler}
	onSave={handleNewLesson}
	title={m.add_own_lesson()}
/>

<audio bind:this={audioPlayer} src="bad_apple.mp3"></audio>
