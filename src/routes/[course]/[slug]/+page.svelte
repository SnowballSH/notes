<script lang="ts">
import mathFont from "@fontsource/stix-two-math/files/stix-two-math-latin-400-normal.woff2?url";
import AuthorNotice from "#lib/components/AuthorNotice.svelte";
import BlockControls from "#lib/components/BlockControls.svelte";
import Breadcrumb from "#lib/components/Breadcrumb.svelte";
import NoteContents from "#lib/components/NoteContents.svelte";
import NoteNeighbours from "#lib/components/NoteNeighbours.svelte";
import PageMeta from "#lib/components/PageMeta.svelte";
import { closableBlocks, rememberBlocks } from "#lib/notes/blocks.ts";
import { fitEquations } from "#lib/notes/equations.ts";
import { zoomableFigures } from "#lib/notes/figures.ts";
import { prepareForPrint } from "#lib/notes/print.ts";
import { recordLastRead } from "#lib/notes/progress.ts";
import { referencePreviews } from "#lib/notes/references.ts";
import { pageTitle, siteName } from "#lib/site/title.ts";
import { widgets } from "#lib/widgets/mount.ts";

const { data } = $props();
const note = $derived(data.note);
const { course, number, previous, next } = $derived(data.navigation);
const trail = $derived([
	{ label: siteName, href: "/" },
	...(course ? [{ label: course.title, href: course.href }] : []),
	...(number ? [{ label: number }] : []),
]);

$effect(() => {
	if (!note.meta.draft) recordLastRead(note.course, `/${note.course}/${note.slug}`);
});
</script>

<PageMeta
	title={pageTitle(note.meta.title, ...(course ? [course.title] : []))}
	description={note.meta.summary}
	kind="article"
/>
<svelte:head>
	{#if note.meta.draft}
		<meta name="robots" content="noindex" />
	{/if}
	{#if note.html.includes("<math")}
		<link rel="preload" as="font" type="font/woff2" href={mathFont} crossorigin="anonymous" />
	{/if}
	{@html `<style>${note.styles}</style>`}
</svelte:head>

<Breadcrumb {trail} />
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{note.meta.title}</h1>
{#if note.meta.draft}
	<p class="mt-2 text-sm text-ink-muted">Draft: shown while developing, left out of the published site.</p>
{/if}
<NoteContents headings={note.headings} />

{#if note.warnings.length > 0}
	<AuthorNotice title="Typst left something out of this page" details={note.warnings} />
{/if}

{#key note.html}
	{#if note.html.includes("<details")}
		<BlockControls container="article.note" />
	{/if}
	<article
		class="note mt-6"
		{@attach widgets}
		{@attach rememberBlocks}
		{@attach closableBlocks}
		{@attach referencePreviews}
		{@attach fitEquations}
		{@attach zoomableFigures}
		{@attach prepareForPrint}
	>
		{@html note.html}
	</article>
{/key}

<NoteNeighbours {previous} {next} outline={course} />
