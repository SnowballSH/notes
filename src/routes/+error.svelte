<script lang="ts">
import { Link } from "foundationui/svelte";
import { pageTitle } from "#lib/site/title.ts";
import { page } from "$app/state";

const missing = $derived(page.status === 404);
const heading = $derived(missing ? "Page not found" : "Something went wrong");
</script>

<svelte:head>
	<title>{pageTitle(heading)}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<p class="text-sm text-ink-muted">Error {page.status}</p>
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{heading}</h1>
{#if missing}
	<p class="mt-3 text-ink-secondary">
		There is no page at this address. It may have been moved or renamed.
	</p>
{:else}
	<pre class="mt-3 overflow-x-auto font-mono text-sm leading-relaxed text-ink-secondary">{page.error
			?.message}</pre>
{/if}
<p class="mt-8"><Link href="/">All notes</Link></p>
