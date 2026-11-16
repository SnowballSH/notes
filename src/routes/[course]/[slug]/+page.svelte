<script lang="ts">
import mathFont from "@fontsource/stix-two-math/files/stix-two-math-latin-400-normal.woff2?url";
import { Link } from "foundationui/svelte";
import AuthorNotice from "#lib/components/AuthorNotice.svelte";
import BlockControls from "#lib/components/BlockControls.svelte";
import Breadcrumb from "#lib/components/Breadcrumb.svelte";
import NoteContents from "#lib/components/NoteContents.svelte";
import NoteNeighbours from "#lib/components/NoteNeighbours.svelte";
import { closableBlocks, rememberBlocks } from "#lib/notes/blocks.ts";
import { prepareForPrint } from "#lib/notes/print.ts";
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
	{#if note.html.includes("<math")}
		<link rel="preload" as="font" type="font/woff2" href={mathFont} crossorigin="anonymous" />
	{/if}
	{@html `<style>${note.styles}</style>`}
</svelte:head>

<Breadcrumb
	trail={[{ label: siteName, href: "/" }, ...(course ? [{ label: course.title, href: course.href }] : [])]}
/>
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{note.meta.title}</h1>
{#if note.meta.draft}
	<p class="mt-2 text-sm text-ink-muted">Draft: shown while developing, left out of the published site.</p>
{/if}
<NoteContents headings={note.headings} />

{#if note.warnings.length > 0}
	<AuthorNotice title="Typst left something out of this page" details={note.warnings} />
{/if}

{#if note.html.includes("<details")}
	<BlockControls container="article.note" />
{/if}

{#key note.html}
	<article
		class="note mt-6"
		{@attach widgets}
		{@attach rememberBlocks}
		{@attach closableBlocks}
		{@attach prepareForPrint}
	>
		{@html note.html}
	</article>
{/key}

<NoteNeighbours {...data.neighbours} />
{#if course}
	<p class="mt-8 text-sm"><Link href={course.href} subtle>Outline of {course.title}</Link></p>
{/if}
