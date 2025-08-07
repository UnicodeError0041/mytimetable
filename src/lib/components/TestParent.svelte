<script lang="ts">
	import { getContext } from "svelte";
	import Test1 from "./Test1.svelte";
	import { SYMBOL_LESSONS_QUERY, type QueryData } from "$lib/lessons/query";
	import { type LessonData } from "$lib/lessons/types";
	import Lesson from "./lessons/Lesson.svelte";
	import TimeTable from "./timetable/TimeTable.svelte";
	import { type TimeTableData } from "./timetable/types";
	import { getQueryClientContext } from "@tanstack/svelte-query";

    let keyword = $state("Analízis I.");

    // $effect(() => {
    //     console.log(keyword);
    // })

    const query = $derived(getContext<QueryData>(SYMBOL_LESSONS_QUERY).query);

    const timeTableDatas: TimeTableData<LessonData>[] = $derived.by(() => 
        query?.data?.filter(l => l.lesson.startTime !== null && l.lesson.endTime !== null && l.lesson.day !== null).map(
            l => (
                {
                    data:l, 
                    time:{
                        startTime:l.lesson.startTime,
                        endTime:l.lesson.endTime,
                        day: l.lesson.day
                    }
                } as TimeTableData<LessonData>
            )
        ) ?? []
    );

</script>

<input type="text" bind:value={keyword}>

<Test1 keyword={keyword}/>

{#snippet element(data: LessonData)}
    <Lesson lesson={data.lesson}/>
{/snippet}

{#if query == null}
    <p>Empty</p>
{:else if query.isLoading}
    <p>Loading...</p>
{:else if query.isError}
    <p>Error: {query.error.message}</p>
{:else if query.isSuccess}
    <TimeTable 
        datas={timeTableDatas}  
        minTime={{hour: 8, minute: 0}} 
        maxTime={{hour: 21, minute: 0}} 
        days={["h", "k", "s", "c", "p"]}
        element={element}
    />
{/if}