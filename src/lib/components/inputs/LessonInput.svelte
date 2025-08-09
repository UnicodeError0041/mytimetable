<script lang="ts">
	import { dayOfWeekToString, getDefaultLesson, type DayOfWeek, type Lesson, type Time } from "$lib/lessons/types";
	import Combobox from "./Combobox.svelte";
	import TimeInput from "./TimeInput.svelte";


    type Props = {
        lesson?: Lesson,
    };

    const defaultValue: Lesson = getDefaultLesson();

    let {lesson=$bindable(defaultValue)}:Props = $props();

</script>

<div class="lesson-input">
    <label>
        <p class="label">Tárgy kód</p>
        <input type="text" class="lesson-input__input text-input text-input--secondary" bind:value={lesson.subjectCode} placeholder="IP-18ANa98h">
    </label>
    <label>
        <p class="label"><span class="--required">*</span> Tárgy név</p>
        <input type="text" class="lesson-input__input text-input text-input--secondary" bind:value={lesson.subjectName} placeholder="Analízis">
    </label>
    <label>
        <p class="label">Kurzus kód</p>
        <input type="text" class="lesson-input__input text-input text-input--secondary" bind:value={lesson.courseCode} placeholder="12, gy12, stb.">
    </label>

    <Combobox classes="lesson-input__input lesson-input__combobox" label="Kurzus típus" required={true} options={["előadás", "gyakorlat", "konzultáció", "elfoglaltság", "munka", "egyéb"]} optionText={(option: string) => option} bind:selected={lesson.courseType}/>

    <Combobox classes="lesson-input__input lesson-input__combobox" label="Nap" required options={["h", "k", "s", "c", "p"] as DayOfWeek[]} optionText={dayOfWeekToString} bind:selected={lesson.day as DayOfWeek}/>

    <div class="lesson-input__time-inputs">
        <TimeInput label="Kezdés idő" required bind:time={lesson.startTime as Time}/>
        <TimeInput label="Befejezés idő" required bind:time={lesson.endTime as Time}/>
    </div>

    <label>
        <p class="label">Tanár név/komment</p>
        <input type="text" class="lesson-input__input text-input text-input--secondary" bind:value={lesson.teacherAndComment} placeholder="Gyenge Pisti">
    </label>
    <label>
        <p class="label">Helyszín</p>
        <input type="text" class="lesson-input__input text-input text-input--secondary" bind:value={lesson.location} placeholder="Déli Épület -2:108">
    </label>
</div>