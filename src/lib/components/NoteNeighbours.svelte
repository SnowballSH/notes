<script lang="ts">
import type { NoteLink, NoteNeighbours } from "#lib/notes/types.ts";

interface Props extends NoteNeighbours {
	outline: { title: string; href: string } | null;
}

const { previous, next, outline }: Props = $props();

const card = [
	"block rounded-md border border-line px-4 py-3 no-underline transition-colors hover:border-accent hover:bg-surface-raised",
	"focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
];
</script>

{#snippet neighbour(note: NoteLink, label: string, rel: "prev" | "next")}
	<a href={note.href} {rel} class={[card, rel === "next" && "sm:col-start-2 sm:text-right"]}>
		<span class="block text-sm text-ink-muted">{label}</span>
		<span class="mt-1 block font-medium text-accent-strong">
			{#if note.number}<span class="font-normal tabular-nums text-ink-muted">{note.number}</span>{/if}
			{note.title}
		</span>
	</a>
{/snippet}

{#if previous || next || outline}
	<nav aria-label="Previous and next notes" class="mt-12 grid gap-4 sm:grid-cols-2">
		{#if previous}{@render neighbour(previous, "Previous", "prev")}{/if}
		{#if next}{@render neighbour(next, "Next", "next")}{/if}
		{#if outline}
			<a href={outline.href} class={[card, "sm:col-span-2 sm:text-center"]}>
				<span class="block text-sm text-ink-muted">Outline</span>
				<span class="mt-1 block font-medium text-accent-strong">{outline.title}</span>
			</a>
		{/if}
	</nav>
{/if}
