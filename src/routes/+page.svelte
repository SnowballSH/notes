<script lang="ts">
import { Link, Panel } from "foundationui/svelte";
import { coursesByCategory } from "#lib/site/courses.ts";
import { siteName } from "#lib/site/title.ts";
</script>

<svelte:head>
	<title>{siteName}</title>
	<meta name="description" content="Academic lecture notes by SnowballSH." />
</svelte:head>

<h1 class="font-display text-3xl font-semibold text-ink">Notes</h1>
<p class="mt-3 text-ink-secondary">Academic lecture notes by SnowballSH.</p>
{#each coursesByCategory as [category, listed] (category)}
	<Panel class="mt-8">
		<p class="text-sm text-ink-muted">{category}</p>
		{#each listed as course (course.slug)}
			<p class="mt-1">
				<Link href={course.href}>{course.outline.title}</Link>
			</p>
		{/each}
	</Panel>
{/each}
