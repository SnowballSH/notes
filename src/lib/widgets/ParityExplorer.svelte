<script lang="ts">
import { untrack } from "svelte";

interface Props {
	size?: number;
}

const { size = 4 }: Props = $props();
const maxSize = 8;
const length = untrack(() => Math.min(Math.max(Math.round(size), 1), maxSize));

let mask = $state(Array.from({ length }, (_, index) => index % 2 === 0));
let input = $state(Array.from({ length }, (_, index) => index < 3));

const selected = $derived(input.filter((bit, index) => bit && mask[index]).length);
const dot = $derived(selected % 2);
</script>

{#snippet row(name: string, label: string, bits: boolean[])}
	<div class="row" role="group" aria-label={label}>
		<span class="name">{name} =</span>
		{#each bits as bit, index (index)}
			<button
				type="button"
				aria-pressed={bit}
				aria-label="{label}, position {index + 1}"
				class:selected={mask[index]}
				onclick={() => (bits[index] = !bit)}
			>
				{bit ? 1 : 0}
			</button>
		{/each}
	</div>
{/snippet}

<figure class="parity">
	{@render row("a", "Mask a", mask)}
	{@render row("x", "Input x", input)}
	<figcaption aria-live="polite">
		<p>
			The mask selects {mask.filter(Boolean).length} of {length} positions, and x has
			{selected} one{selected === 1 ? "" : "s"} there: an {dot === 1 ? "odd" : "even"} number.
		</p>
		<p class="result">
			a &middot; x = {dot}, so the sign form gives {dot === 1 ? "-1" : "+1"}.
		</p>
	</figcaption>
</figure>

<style>
.parity {
	margin: 0;
	display: grid;
	gap: 0.5rem;
	justify-items: start;
}
.row {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	font-family: var(--fui-font-mono);
}
.name {
	min-width: 2.25rem;
	color: var(--fui-ink-secondary);
}
button {
	width: 2.25rem;
	height: 2.25rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink-muted);
	font: inherit;
	cursor: pointer;
}
button.selected {
	border-color: var(--fui-accent);
	background: var(--fui-surface-raised);
	color: var(--fui-ink);
	font-weight: 700;
}
button:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
figcaption {
	margin-top: 0.25rem;
	font-size: 0.875rem;
	color: var(--fui-ink-secondary);
}
.result {
	color: var(--fui-ink);
	font-weight: 600;
}
</style>
