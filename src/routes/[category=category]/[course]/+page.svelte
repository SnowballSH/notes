<script lang="ts">
import { Badge } from "foundationui/svelte";
import Breadcrumb from "#lib/components/Breadcrumb.svelte";
import PageMeta from "#lib/components/PageMeta.svelte";
import ReadingStart from "#lib/components/ReadingStart.svelte";
import SectionRow from "#lib/components/SectionRow.svelte";
import { readingOrder } from "#lib/outlines/contents.ts";
import { pageTitle, siteName } from "#lib/site/title.ts";

const { data } = $props();
const course = $derived(data.course);
const linked = $derived(readingOrder(course.parts));

const partsLabel = (parts: string): string =>
	/^\d+$/.test(parts) ? `part ${parts}` : `parts ${parts}`;
</script>

<PageMeta title={pageTitle(course.title)} description={course.description} />

<Breadcrumb trail={[{ label: siteName, href: "/" }, { label: data.category }]} />
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">{course.title}</h1>
<p class="mt-3 text-ink-secondary">{course.description}</p>
{#if linked.length > 0}
	<p class="mt-6"><ReadingStart course={course.slug} sections={linked} /></p>
{/if}

<ol class="mt-10 space-y-8">
	{#each course.parts as part (part.number)}
		<li>
			<h2 class="font-display text-xl font-semibold text-ink">{part.number}. {part.title}</h2>
			<ol class="mt-2">
				{#each part.sections as section (section.number)}
					{@const planned = section.state === "planned"}
					<li>
						<SectionRow number={section.number} href={section.href}>
							<h3 class="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
								<span class={planned ? "text-ink-muted" : "text-accent-strong group-hover:underline"}>
									{section.title}
								</span>
								{#if planned}
									<Badge>Planned</Badge>
								{:else if section.state === "draft"}
									<Badge tone="accent">Draft</Badge>
								{/if}
							</h3>
							<p class={["mt-1 text-sm", planned ? "text-ink-muted" : "text-ink-secondary"]}>
								{section.summary}
							</p>
						</SectionRow>
					</li>
				{/each}
			</ol>
		</li>
	{/each}
</ol>

{#if data.sources.length > 0}
	<h2 class="mt-12 font-display text-xl font-semibold text-ink">Sources</h2>
	<ul class="mt-4 space-y-2 text-sm text-ink-secondary">
		{#each data.sources as source (source.work)}
			<li>{source.work} <span class="text-ink-muted">({partsLabel(source.chapters)})</span></li>
		{/each}
	</ul>
{/if}
