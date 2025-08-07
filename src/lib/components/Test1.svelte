<script lang="ts">
    import { createLessonsQuery, SYMBOL_LESSONS_QUERY, type QueryData} from "$lib/lessons/query";
	import { debounced } from '$lib/utility.svelte';
	import { getContext } from "svelte";

    const {keyword}: {keyword:string} = $props();

    const queryKeyword = (keyword:string) => createLessonsQuery({startYear: 2024, isSpring:true}, keyword, "keresnevre");

    const debouncedKeyword = debounced(() => keyword, 500);

    const query = $derived(queryKeyword(debouncedKeyword()));
    const query2 = $derived($query);

    const ctx = getContext<QueryData>(SYMBOL_LESSONS_QUERY);

    $effect(() => {
        // console.log("ran");
        ctx.query = query2;
    })
    

</script>
