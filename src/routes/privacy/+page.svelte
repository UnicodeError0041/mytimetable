<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.privacy_title()}</title>
	<meta name="description" content={m.privacy_description()} />
</svelte:head>

<h1>{m.privacy_title()}</h1>

<p>
	This website uses <a href="https://vercel.com/docs/analytics/privacy-policy">Vercel Analytics</a>
	and
	<a href="https://vercel.com/docs/speed-insights/privacy-policy">Vercel Speed Insights</a>
	to measure traffic and performance.
</p>

<p>
	These tools <strong
		>do not use cookies and do not collect personally identifiable information.</strong
	>
	The collected data are used only in aggregated form to improve the site’s speed, content, and user experience.
</p>

<p>
	{m.privacy_open_source_text()}
</p>
