<script lang="ts">
	import { type RadioGroupProps } from "melt/builders";
	import RadioGroup from "./RadioGroup.svelte";
	import { semesterToString, type Semester } from "$lib/lessons/types";

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

        let date = new Date();

        for (let i = 0; i < semesterCount; i++){
            const year = date.getFullYear();

            if (date.getMonth() < 6){
                returned.push(semesterToString({startYear: year - 1, isSpring: true}));
            } else {
                returned.push(semesterToString({startYear: year, isSpring: false}));
            }

            date = new Date(date.getTime() - new Date(1970, 6, 1, 0, 0, 0, 0).getTime());
        }

        return returned;
    });

    value = items[0];

</script>
<RadioGroup {...{items, options, classes, label} } bind:value={value} />