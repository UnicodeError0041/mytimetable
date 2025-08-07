<script lang="ts">
	import { QUERY_MODES, type QueryMode } from "$lib/lessons/query";
	import type { RadioGroupProps } from "melt/builders";
	import RadioGroup from "./RadioGroup.svelte";

    type Props = {
        label?: string,
        classes?: string,
        options?: RadioGroupProps,
        value: QueryMode,
    }

    let {label, classes, options, value=$bindable()}: Props = $props();
</script>

{#snippet content(value: string)}
    {@const v = value as QueryMode}

    {#if v === "keres_kod_azon" }
        <div class="icon-text"> <span class="ix--id"></span> <p>Tárgy azonosító</p></div>
    {:else if v === "keres_okt"}
        <div class="icon-text"> <span class="ix--user"></span> <p>Oktató</p></div>
    {:else if v === "keresnevre"}
        <div class="icon-text"> <span class="ix--book"></span> <p>Tárgy név</p></div>
    {/if}
{/snippet}

<RadioGroup {...{label, classes, options}} items={QUERY_MODES} bind:value={value} valueSnippet={content}/>