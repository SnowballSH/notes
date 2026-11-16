<script lang="ts">
import ActionLink from "#lib/components/ActionLink.svelte";
import { lastRead } from "#lib/notes/progress.ts";
import type { LinkedSection } from "#lib/outlines/contents.ts";

/** The course's written sections in reading order; the action leads to the last one read, or the first. */
const { course, sections }: { course: string; sections: LinkedSection[] } = $props();

let resumed = $state<LinkedSection>();

$effect(() => {
	const href = lastRead(course);
	resumed = sections.find((section, index) => index > 0 && section.href === href);
});

const target = $derived(resumed ?? sections[0]);
</script>

{#if target}
	<ActionLink href={target.href}>
		{resumed ? `Continue with ${resumed.number}` : "Start reading"}
	</ActionLink>
{/if}
