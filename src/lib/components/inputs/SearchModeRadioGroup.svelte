<script lang="ts">
	import { QUERY_MODES, type QueryMode } from '$lib/lessons/query';
	import { m } from '$lib/paraglide/messages.js';
	import type { RadioGroupProps } from 'melt/builders';
	import RadioGroup from './RadioGroup.svelte';

	type Props = {
		label?: string;
		classes?: string;
		options?: RadioGroupProps;
		value: QueryMode;
	};

	let { label, classes, options, value = $bindable() }: Props = $props();
</script>

{#snippet content(value: string)}
	{@const v = value as QueryMode}

	{#if v === 'keres_kod_azon'}
		<div class="icon-text">
			<span class="ix--id"></span>
			<p>{m.search_mode_subject_code()}</p>
		</div>
	{:else if v === 'keres_okt'}
		<div class="icon-text">
			<span class="ix--user"></span>
			<p>{m.search_mode_teacher()}</p>
		</div>
	{:else if v === 'keresnevre'}
		<div class="icon-text">
			<span class="ix--book"></span>
			<p>{m.search_mode_subject_name()}</p>
		</div>
	{/if}
{/snippet}

<RadioGroup
	{...{ label, classes, options }}
	items={QUERY_MODES}
	bind:value
	valueSnippet={content}
/>
