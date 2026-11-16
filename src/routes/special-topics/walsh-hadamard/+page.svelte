<script lang="ts">
import { Link } from "foundationui/svelte";
import Breadcrumb from "#lib/components/Breadcrumb.svelte";
import { requireCourse } from "#lib/site/courses.ts";
import { pageTitle, siteName } from "#lib/site/title.ts";

const { category, outline } = requireCourse("walsh-hadamard");

const sections = outline.chapters.flatMap((chapter) => chapter.sections);
const written = sections.filter((section) => section.href).length;
const status =
	written === 0
		? "Outline only. The notes themselves are still to come."
		: written < sections.length
			? "The linked notes are written. The others are planned."
			: null;

const partsLabel = (parts: string): string =>
	/^\d+$/.test(parts) ? `part ${parts}` : `parts ${parts}`;
</script>

<svelte:head>
	<title>{pageTitle(outline.title)}</title>
	<meta name="description" content={outline.description} />
</svelte:head>

<Breadcrumb trail={[{ label: siteName, href: "/" }, { label: category }]} />
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{outline.title}</h1>
<p class="mt-3 text-ink-secondary">{outline.description}</p>
{#if status}
	<p class="mt-2 text-sm text-ink-muted">{status}</p>
{/if}

<ol class="mt-10 space-y-10">
	{#each outline.chapters as chapter, chapterIndex (chapter.title)}
		<li>
			<h2 class="font-display text-xl font-semibold text-ink">
				{chapterIndex + 1}. {chapter.title}
			</h2>
			<ol class="mt-4 space-y-4">
				{#each chapter.sections as section, sectionIndex (section.title)}
					<li>
						<h3 class="font-medium text-ink">
							{chapterIndex + 1}.{sectionIndex + 1}
							{#if section.href}
								<Link href={section.href}>{section.title}</Link>
							{:else}
								{section.title}
							{/if}
						</h3>
						<p class="mt-1 text-sm text-ink-secondary">{section.summary}</p>
					</li>
				{/each}
			</ol>
		</li>
	{/each}
</ol>

<h2 class="mt-12 font-display text-xl font-semibold text-ink">Sources</h2>
<ul class="mt-4 space-y-2 text-sm text-ink-secondary">
	{#each outline.sources as source (source.work)}
		<li>{source.work} <span class="text-ink-muted">({partsLabel(source.chapters)})</span></li>
	{/each}
</ul>

