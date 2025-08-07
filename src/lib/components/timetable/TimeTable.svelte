<script lang="ts" generics="T">
	import { timeFromString, timeToNumber, timeToString, type DayOfWeek, type Time } from "$lib/lessons/types";
	import type { Snippet } from "svelte";
    import type { TimeTableData } from "./types"
	import TimeTableColumn from "./TimeTableColumn.svelte";
    import type {LengthUnitSuffix, Unit} from "@karibash/pixel-units";

    type Props = {
        datas: TimeTableData<T>[]
        element: Snippet<[T]>,
        minTime: Time,
        maxTime: Time,
        days: DayOfWeek[],
        style?: {
            heightPerHour?: Unit<LengthUnitSuffix>,
            hourSubdivide?: number
        }
    };

    const {datas, element, minTime, maxTime, days, style}: Props = $props();
    
    const dataPerDays = $derived.by(() => {
        let returned = new Map<string, TimeTableData<T>[]>();
        
        datas.forEach(data => 
        returned.has(data.time.day) ? 
            returned.get(data.time.day)?.push(data) : 
            returned.set(data.time.day, [data]));
        
        return returned;
    })

    const hours = $derived((timeToNumber(maxTime) - timeToNumber(minTime)) / 60);
    const daysCount = $derived(days.length);

    const hoursArr = $derived([...Array(hours + 1).keys()].map(h => h + minTime.hour));

    const divisionMinutes = $derived.by(() => {
        const divide = (style?.hourSubdivide ?? 2)
        const unit = 60 / divide;

        let returned = [];

        for (let i = 1; i < divide; i++){
            returned.push(i * unit);
        }

        return returned;
    })

</script>

<div class="timetable">
    <div class="timetable__body" style="
        --height-per-hour: {style?.heightPerHour ?? "4rem"};
        --hours: {hours};
        --daysCount: {daysCount};
    ">
        <div class="timetable__corner"></div>
        <div class="timetable__lines">
            {#each hoursArr as hour}
                    <div class="timetable__hour-line" style="--top: {100 * (hour - timeToNumber(minTime) / 60) / hours}%;"></div>

                    {#each divisionMinutes as minute}
                        <div class="timetable__minute-line" style="--top: {(100 / 60) * (timeToNumber({hour, minute}) - timeToNumber(minTime)) / hours}%;"></div>
                    {/each}
            {/each}
        </div>
        <div class="timetable__sidebar">
            <p class="--invisible">10:00</p>
            {#each hoursArr as hour}
                <p class="timetable__hour-mark" style="--top: {100 * (hour - timeToNumber(minTime) / 60) / hours}%;">{timeToString({hour, minute: 0})}</p>
            {/each}
        </div>
        {#each days as day, i}
            <TimeTableColumn dayIdx={i} day={day} minTime={minTime} maxTime={maxTime} element={element} datas={dataPerDays.get(day) ?? []} />
        {/each}
    </div>
</div>
