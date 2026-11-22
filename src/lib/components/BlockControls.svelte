<script lang="ts">
import { blocksIn, setAllBlocks } from "#lib/notes/blocks.ts";

/** The element that holds the note, by selector, since the note is rendered after this control. */
const { container }: { container: string } = $props();

let allOpen = $state(false);

const refresh = () => {
	const note = document.querySelector(container);
	allOpen = note !== null && blocksIn(note).every((block) => block.open);
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

<button type="button" class="note-control" onclick={toggleAll}>
	{allOpen ? "Close all proofs" : "Open all proofs"}
</button>
