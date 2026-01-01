<script lang="ts">
	import { type RadioGroupProps } from "melt/builders";
	import RadioGroup from "./RadioGroup.svelte";
	import { getCurrentSemester, getPreviousSemester, semesterToString, type Semester } from "$lib/lessons/types";

    type Props = {
        semesterCount: number,
        label?: string,
        classes?: string,
        options?: RadioGroupProps
        value: string,
    }

    let {semesterCount, label, classes, options, value=$bindable()}: Props = $props();


    const items = $derived.by(() => {
        let returned: string[] = [];

        let semester = getCurrentSemester();

        returned.push(semesterToString(semester));

        for (let i = 1; i < semesterCount; i++){
            semester = getPreviousSemester(semester);
            returned.push(semesterToString(semester));
        }

        return returned;
    });

    value = items[0];

</script>
<RadioGroup {...{items, options, classes, label} } bind:value={value} />