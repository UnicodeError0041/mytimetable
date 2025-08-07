<script lang="ts" generics="T">
	import { timeToNumber, type Time } from "$lib/lessons/types";
	import type { PlacedTimeTableData } from "./types";
    import type { Snippet } from "svelte";

    type Props = {
        placementData: PlacedTimeTableData<T>,
        element: Snippet<[T]>,
        minTime: Time,
        maxTime: Time,
    }

    const {placementData, element, minTime, maxTime}: Props = $props();

    const minTimeValue = $derived(timeToNumber(minTime));
    const maxTimeValue = $derived(timeToNumber(maxTime));

    const startTimeValue = $derived(timeToNumber(placementData.time.startTime));
    const endTimeValue = $derived(timeToNumber(placementData.time.endTime));

    const startTimePercentage = $derived(100 * (startTimeValue - minTimeValue) / (maxTimeValue - minTimeValue));
    const endTimePercentage = $derived(100 - 100 * (endTimeValue - minTimeValue) / (maxTimeValue - minTimeValue));

</script>
<div class="timetable__element" style="
    --column-start: {placementData.column + 1}; 
    --column-end: {placementData.column + placementData.span + 1};
    --top: {startTimePercentage}%;
    --bottom: {endTimePercentage}%;
    "
>
    {@render element(placementData.data)}
</div>
