<script lang="ts">
import { Link } from "foundationui/svelte";
import { pageTitle } from "#lib/site/title.ts";
import { page } from "$app/state";

const missing = $derived(page.status === 404);
const heading = $derived(missing ? "Page not found" : "Something went wrong");
</script>

<svelte:head>
	<title>{pageTitle(heading)}</title>
</svelte:head>

<p class="text-sm text-ink-muted">Error {page.status}</p>
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{heading}</h1>
<p class="mt-3 text-ink-secondary">
	{#if missing}
		There is no page at this address. It may have been moved or renamed.
	{:else}
		{page.error?.message}
	{/if}
</p>
<p class="mt-8"><Link href="/">All notes</Link></p>
