<script lang="ts">
	import { browser } from '$app/env';
	import { m } from '$lib/paraglide/messages';
	import type { Snippet } from 'svelte';
	import Tooltip from './Tooltip.svelte';

	type Props = {
		styleClasses?: string;
		iconClasses?: string;
		children: Snippet<[]>;
		localStorageKey?: string;
	};

	const { children, localStorageKey, styleClasses = '', iconClasses = '' }: Props = $props();

	const dismissible = $derived(!!localStorageKey);

	const initialDismissedValue = $derived(
		dismissible && browser && localStorage.getItem(`dismissibleAlert:${localStorageKey}`) === 'true'
	);

	let isDismissed = $state(initialDismissedValue);

	const onDismiss = () => {
		localStorage.setItem(`dismissibleAlert:${localStorageKey}`, 'true');
		isDismissed = true;
	};
</script>

{#if !isDismissed}
	<div class={['icon-text', styleClasses, dismissible && 'dismissible-alert']}>
		<span class="ix--info {iconClasses}"></span>
		<div>{@render children()}</div>
		{#if dismissible}
			<Tooltip content={m.dont_show_again()} triggerType="hover">
				<button
					aria-label={m.dont_show_again()}
					onclick={onDismiss}
					class="button button--icon --pulse-on-hover --fs-h5"
					><span class="ix--close-small"></span></button
				>
			</Tooltip>
		{/if}
	</div>
{/if}
