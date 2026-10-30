<script lang="ts">
import { Link } from "foundationui/svelte";
import { walshHadamard as outline } from "$lib/outlines/walsh-hadamard";
</script>

<svelte:head>
	<title>{outline.title} · Notes</title>
	<meta name="description" content={outline.description} />
</svelte:head>

<p class="text-sm text-ink-muted">Special topics</p>
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{outline.title}</h1>
<p class="mt-3 text-ink-secondary">{outline.description}</p>
<p class="mt-2 text-sm text-ink-muted">Outline only. The notes themselves are still to come.</p>

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
							{chapterIndex + 1}.{sectionIndex + 1} {section.title}
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
		<li>{source.work} <span class="text-ink-muted">(chapters {source.chapters})</span></li>
	{/each}
</ul>

<p class="mt-10 text-sm"><Link href="/" subtle>All notes</Link></p>
