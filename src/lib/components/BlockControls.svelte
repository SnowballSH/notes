<script lang="ts">
import { setAllBlocks } from "#lib/notes/blocks.ts";

/** The element that holds the note, by selector, since the note is rendered after this control. */
const { container }: { container: string } = $props();

let allOpen = $state(false);

const blocks = (): HTMLDetailsElement[] => [
	...document.querySelectorAll<HTMLDetailsElement>(`${container} details`),
];
const refresh = () => {
	allOpen = blocks().every((block) => block.open);
};

$effect(() => {
	refresh();
	document.addEventListener("toggle", refresh, true);
	return () => document.removeEventListener("toggle", refresh, true);
});

function toggleAll(): void {
	const note = document.querySelector(container);
	if (note) setAllBlocks(note, !allOpen);
}
</script>

<button type="button" class="block-controls" aria-pressed={allOpen} onclick={toggleAll}>
	{allOpen ? "Close all proofs" : "Open all proofs"}
</button>

<style>
.block-controls {
	margin-top: 1rem;
	padding: 0.375rem 0.75rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	font-size: 0.875rem;
	color: var(--fui-ink-secondary);
	cursor: pointer;
}
.block-controls:hover {
	border-color: var(--fui-accent);
	color: var(--fui-accent-strong);
}
.block-controls:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
@media (pointer: coarse) {
	.block-controls {
		min-height: 2.75rem;
	}
}
@media print {
	.block-controls {
		display: none;
	}
}
</style>
