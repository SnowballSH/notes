<script lang="ts">
import { Badge, Link, Panel } from "foundationui/svelte";
import ReadingStart from "#lib/components/ReadingStart.svelte";
import SectionRow from "#lib/components/SectionRow.svelte";
import { allSections, readingOrder } from "#lib/outlines/contents.ts";
import { siteName } from "#lib/site/title.ts";

const { data } = $props();
</script>

<svelte:head>
	<title>{siteName}</title>
	<meta name="description" content="Academic lecture notes by SnowballSH." />
</svelte:head>

<h1 class="font-display text-3xl font-semibold text-ink">Notes</h1>
<p class="mt-3 text-ink-secondary">Academic lecture notes by SnowballSH.</p>
{#each data.categories as category (category.title)}
	<section class="mt-10">
		<h2 class="text-sm text-ink-muted">{category.title}</h2>
		{#each category.courses as course (course.slug)}
			{@const sections = allSections(course.parts)}
			{@const linked = readingOrder(course.parts)}
			<Panel padding="lg" class="mt-3">
				<h3 class="font-display text-2xl font-semibold text-ink">{course.title}</h3>
				<p class="mt-2 text-ink-secondary">{course.description}</p>
				<div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
					<ReadingStart course={course.slug} sections={linked} />
					<Link href={course.href} class="inline-flex min-h-11 items-center">Full outline</Link>
				</div>
				<p class="mt-6 text-sm text-ink-muted">
					{sections.filter((section) => section.state === "written").length} of {sections.length}
					sections written
				</p>
				{#if linked.length > 0}
					<ol class="mt-1">
						{#each linked as section (section.number)}
							<li>
								<SectionRow number={section.number} href={section.href}>
									<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
										<span class="font-medium text-accent-strong group-hover:underline">
											{section.title}
										</span>
										{#if section.state === "draft"}
											<Badge tone="accent">Draft</Badge>
										{/if}
									</span>
								</SectionRow>
							</li>
						{/each}
					</ol>
				{/if}
			</Panel>
		{/each}
	</section>
{/each}
