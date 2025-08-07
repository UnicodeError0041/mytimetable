<script lang="ts">
	import { createLessonsQuery, SYMBOL_LESSONS_QUERY, type QueryData, type QueryMode } from "$lib/lessons/query";
	import { getContext } from "svelte";
	import SearchModeRadioGroup from "./inputs/SearchModeRadioGroup.svelte";
	import SemesterRadioGroup from "./inputs/SemesterRadioGroup.svelte";
	import { semesterFromString, type LessonData, type Semester } from "$lib/lessons/types";
    import { debounced } from '$lib/utility.svelte';
	import type { CreateQueryResult } from "@tanstack/svelte-query";

    type QueryArgs = [
        Semester,
        string,
        QueryMode,
    ]

    let semester = $state("2024-2025-2");
    let mode: QueryMode = $state("keresnevre");
    let keyword = $state("");

    let queryArgs: QueryArgs = $state([semesterFromString(semester), keyword, mode]);

    const debouncedQueryArgs = debounced(() => queryArgs, 500);

    const createQueryResult: CreateQueryResult<LessonData[], Error>= $derived.by( () =>
            createLessonsQuery(...debouncedQueryArgs())
        );
    
    const query = $derived($createQueryResult);
    
    const ctx = getContext<QueryData>(SYMBOL_LESSONS_QUERY);

    $effect(() => {
        ctx.query = query;
    })

    const onSubmit = (e: SubmitEvent) => {
        e.preventDefault();

        queryArgs = [semesterFromString(semester), keyword, mode];
        // createQueryResult.subscribe(res => ctx.query = res);
    }

</script>
<form class="search" onsubmit={onSubmit}>
    <input class="text-input" type="search" name="name" bind:value={keyword} 
        placeholder="pl: {
            mode === "keres_kod_azon" ? 
                "IP-UL0S3T" 
            : mode === "keresnevre" ?
                "Analízis"
            :
                "Gyenge Pisti"
        }" 
    >
    <SemesterRadioGroup semesterCount={4} label="Félévek" options={{orientation: "horizontal"}} bind:value={semester}/>
    <SearchModeRadioGroup label="Keresés mód" options={{orientation: "horizontal"}} bind:value={mode}/>
    <button class="icon-text button --pulse-on-hover button--primary-filled --fs-h5" type="submit" disabled={query.isLoading}>
        <span class={query.isLoading ? "ix--draw-circle-arc --spinning" : "ix--search"}></span>
        <p>Keresés</p>
    </button>

    {#if query.isLoading}
        <p>Keresés...</p>
    {:else if query.isFetched}
        <p>{query.data?.length} találat</p>
    {/if}
</form>