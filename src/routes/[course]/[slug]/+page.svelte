<script lang="ts">
import { Link } from "foundationui/svelte";
import Breadcrumb from "#lib/components/Breadcrumb.svelte";
import NoteNeighbours from "#lib/components/NoteNeighbours.svelte";
import { pageTitle, siteName } from "#lib/site/title.ts";
import { widgets } from "#lib/widgets/mount.ts";

const { data } = $props();
const note = $derived(data.note);
const course = $derived(data.course);
</script>

<svelte:head>
	<title>{pageTitle(note.meta.title, ...(course ? [course.title] : []))}</title>
	{#if note.meta.summary}
		<meta name="description" content={note.meta.summary} />
	{/if}
	{@html `<style>${note.styles}</style>`}
</svelte:head>

<Breadcrumb
	trail={[{ label: siteName, href: "/" }, ...(course ? [{ label: course.title, href: course.href }] : [])]}
/>
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{note.meta.title}</h1>

{#key note.html}
	<article class="note mt-8" {@attach widgets}>
		{@html note.html}
	</article>
{/key}

<NoteNeighbours {...data.neighbours} />
{#if course}
	<p class="mt-8 text-sm"><Link href={course.href} subtle>Outline of {course.title}</Link></p>
{/if}
