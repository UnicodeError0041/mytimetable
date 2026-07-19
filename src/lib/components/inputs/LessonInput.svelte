<script lang="ts">
	import {
		courseTypeToLocalizedString,
		dayOfWeekToLocalizedString
	} from '$lib/lessons/localization.svelte';
	import { getDefaultLesson, type DayOfWeek, type Lesson, type Time } from '$lib/lessons/types';
	import { m } from '$lib/paraglide/messages.js';
	import Combobox from './Combobox.svelte';
	import TimeInput from './TimeInput.svelte';

	type Props = {
		lesson?: Lesson;
	};

	const defaultValue: Lesson = getDefaultLesson();

	let { lesson = $bindable(defaultValue) }: Props = $props();
</script>

<div class="lesson-input">
	<label>
		<p class="label">{m.lesson_subject_code()}</p>
		<input
			type="text"
			class="lesson-input__input text-input text-input--secondary"
			bind:value={lesson.subjectCode}
			placeholder={m.lesson_subject_code_placeholder()}
		/>
	</label>
	<label>
		<p class="label"><span class="--required">*</span> {m.lesson_subject_name()}</p>
		<input
			type="text"
			class="lesson-input__input text-input text-input--secondary"
			bind:value={lesson.subjectName}
			placeholder={m.lesson_subject_name_placeholder()}
		/>
	</label>
	<label>
		<p class="label">{m.lesson_course_code()}</p>
		<input
			type="text"
			class="lesson-input__input text-input text-input--secondary"
			bind:value={lesson.courseCode}
			placeholder={m.lesson_course_code_placeholder()}
		/>
	</label>

	<Combobox
		classes="lesson-input__input lesson-input__combobox"
		label={m.lesson_course_type()}
		required={true}
		options={['előadás', 'gyakorlat', 'konzultáció', 'elfoglaltság', 'munka', 'egyéb']}
		optionText={courseTypeToLocalizedString}
		bind:selected={lesson.courseType}
	/>

	<Combobox
		classes="lesson-input__input lesson-input__combobox"
		label={m.lesson_day()}
		required
		options={['h', 'k', 's', 'c', 'p'] as DayOfWeek[]}
		optionText={dayOfWeekToLocalizedString}
		bind:selected={lesson.day as DayOfWeek}
	/>

	<div class="lesson-input__time-inputs">
		<TimeInput label={m.lesson_start_time()} required bind:time={lesson.startTime as Time} />
		<TimeInput label={m.lesson_end_time()} required bind:time={lesson.endTime as Time} />
	</div>

	<label>
		<p class="label">{m.lesson_teacher_comment()}</p>
		<input
			type="text"
			class="lesson-input__input text-input text-input--secondary"
			bind:value={lesson.teacherAndComment}
			placeholder={m.lesson_teacher_comment_placeholder()}
		/>
	</label>
	<label>
		<p class="label">{m.lesson_location()}</p>
		<input
			type="text"
			class="lesson-input__input text-input text-input--secondary"
			bind:value={lesson.location}
			placeholder={m.lesson_location_placeholder()}
		/>
	</label>
</div>
