<script lang="ts">
import type { NoteLink, NoteNeighbours } from "#lib/notes/types.ts";

const { previous, next }: NoteNeighbours = $props();
</script>

{#snippet neighbour(note: NoteLink, label: string, rel: "prev" | "next")}
	<a
		href={note.href}
		{rel}
		class={[
			"block rounded-md border border-line px-4 py-3 no-underline transition-colors hover:border-accent hover:bg-surface-raised",
			"focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
			rel === "next" && "sm:col-start-2 sm:text-right",
		]}
	>
		<span class="block text-sm text-ink-muted">{label}</span>
		<span class="mt-1 block font-medium text-accent-strong">{note.title}</span>
	</a>
{/snippet}

{#if previous || next}
	<nav aria-label="Previous and next notes" class="mt-12 grid gap-4 sm:grid-cols-2">
		{#if previous}{@render neighbour(previous, "Previous", "prev")}{/if}
		{#if next}{@render neighbour(next, "Next", "next")}{/if}
	</nav>
{/if}
