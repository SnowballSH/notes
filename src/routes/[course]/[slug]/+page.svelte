<script lang="ts">
import { Link } from "foundationui/svelte";
import { widgets } from "#lib/widgets/mount.ts";

const { data } = $props();
const note = $derived(data.note);
</script>

<svelte:head>
	<title>{note.meta.title} Notes</title>
	{#if note.meta.summary}
		<meta name="description" content={note.meta.summary} />
	{/if}
	{@html `<style>${note.styles}</style>`}
</svelte:head>

<p class="text-sm text-ink-muted">{note.course}</p>
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{note.meta.title}</h1>

{#key note.html}
	<article class="note mt-8" {@attach widgets}>
		{@html note.html}
	</article>
{/key}

<p class="mt-12"><Link href="/">All notes</Link></p>
