<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { browser } from '$app/environment';
	import { QueryClient } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client';
	import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { ModeWatcher, toggleMode, mode } from 'mode-watcher';

	import { setLocale, getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import DismissibleAlert from '$lib/components/DismissibleAlert.svelte';

	injectSpeedInsights();
	injectAnalytics();

	let { children } = $props();
	const queryClient = new QueryClient({ defaultOptions: { queries: { enabled: browser } } });
	const persister = createAsyncStoragePersister({ storage: browser ? window.localStorage : null });

	const locale = $derived(getLocale());
</script>

<ModeWatcher darkClassNames={['dark-mode']} lightClassNames={['light-mode']} />

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
	<header>
		<nav class="nav">
			<a class="nav__title" href="/">{m.nav_title()}</a>
			<div class="nav__buttons">
				<div>
					{#if locale != 'hu'}
						<button
							class="button button--icon --pulse-on-hover --fs-h5"
							onclick={() => setLocale('hu')}
							aria-label={m.nav_switch_hu()}
						>
							<div class="flag--hu-4x3"></div>
						</button>
					{/if}
					{#if locale != 'en'}
						<button
							class="button button--icon --pulse-on-hover --fs-h5"
							onclick={() => setLocale('en')}
							aria-label={m.nav_switch_en()}
						>
							<div class="flag--gb-4x3"></div>
						</button>
					{/if}
				</div>
				<button
					class="button button--icon --pulse-on-hover --fs-h5"
					onclick={toggleMode}
					aria-label={m.nav_theme_toggle()}
				>
					<div class={mode.current === 'dark' ? 'ix--sun' : 'ix--moon'}></div>
				</button>
			</div>
		</nav>
		{#if ['en'].includes(locale)}
			<DismissibleAlert localStorageKey={`aiTranslation:${locale}`}>
				<p>{m.translation_made_with_ai()}</p>
			</DismissibleAlert>
		{/if}
	</header>

	<main>{@render children()}</main>

	<footer>
		<p>{m.footer_data_source()}</p>

		<div class="icon --fs-h3">
			<a
				class="ix--github-logo"
				target="_blank"
				href="https://github.com/UnicodeError0041/mytimetable"
				aria-label="GitHub"
			></a>
		</div>

		<a href="/privacy">{m.footer_privacy()}</a>
	</footer>

	<SvelteQueryDevtools />
</PersistQueryClientProvider>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
