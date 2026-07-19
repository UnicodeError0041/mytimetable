<script lang="ts">
	import {
		getDefaultLesson,
		lessonDataFromLesson,
		timeToNumber,
		type Lesson,
		type LessonData
	} from '$lib/lessons/types';
	import { m } from '$lib/paraglide/messages.js';
	import LessonInput from './inputs/LessonInput.svelte';

	type Props = {
		dialogOpenHandler: (defaultLesson?: Lesson) => void;
		onSave: (lesson: LessonData) => void;
		title?: string;
	};

	let {
		dialogOpenHandler = $bindable(),
		onSave,
		title = m.lesson_dialog_title()
	}: Props = $props();

	let dialogElement: HTMLDialogElement = $state(null!);

	let lesson: Lesson = $state(getDefaultLesson());

	dialogOpenHandler = (defaultLesson?: Lesson) => {
		lesson = defaultLesson ?? getDefaultLesson();
		dialogElement.showModal();
	};

	const isValidLesson = (l: Lesson) =>
		l.subjectName !== '' &&
		l.startTime !== null &&
		l.endTime !== null &&
		l.startTime &&
		l.endTime &&
		timeToNumber(l.startTime) < timeToNumber(l.endTime) &&
		l.day !== null &&
		l.courseType !== '';

	const lessonSaveHandler = () => {
		if (lesson === undefined || !isValidLesson(lesson)) {
			return;
		}

		onSave(lessonDataFromLesson(lesson, true));
		dialogElement.close();
	};

	const closeHandler = () => {
		dialogElement.close();
	};

	const isInvalid = $derived(lesson === undefined || !isValidLesson(lesson));
</script>

<dialog class="dialog" bind:this={dialogElement}>
	<p class="--fs-h3">{title}</p>
	<LessonInput bind:lesson />

	<div class="dialog__buttons">
		{#if lesson.startTime !== null && lesson.endTime !== null && lesson.startTime && lesson.endTime && timeToNumber(lesson.startTime) >= timeToNumber(lesson.endTime)}
			<div class="icon-text --error">
				<span class="ix--warning-rhomb"></span>
				<p>{m.lesson_start_before_end()}</p>
			</div>
		{/if}
		<button
			class="button button--primary-filled icon-text --pulse-on-hover"
			onclick={lessonSaveHandler}
			disabled={isInvalid}
		>
			<span class="ix--disk"></span>
			<p>{m.lesson_save()}</p>
		</button>
		<button class="button --pulse-on-hover" onclick={closeHandler}>{m.lesson_cancel()}</button>
	</div>
</dialog>
