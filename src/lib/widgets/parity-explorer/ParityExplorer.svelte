<script lang="ts">
import { untrack } from "svelte";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";

const { size }: WidgetProps<typeof definition> = $props();
const length = untrack(() => size);

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

<WidgetFrame>
	<div class="rows">
		{@render row("a", "Mask a", mask)}
		{@render row("x", "Input x", input)}
	</div>
	{#snippet caption()}
		<p>
			The mask selects {mask.filter(Boolean).length} of {length} positions, and x has
			{selected} one{selected === 1 ? "" : "s"} there: an {dot === 1 ? "odd" : "even"} number.
		</p>
		<p class="result">
			a &middot; x = {dot}, so the sign form gives {dot === 1 ? "-1" : "+1"}.
		</p>
	{/snippet}
</WidgetFrame>

<style>
.rows {
	display: grid;
	gap: 0.5rem;
}
.row {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	font-family: var(--fui-font-mono);
}
.name {
	min-width: 2.75rem;
	color: var(--fui-ink-secondary);
}
/* Restates the resting look so that the frame's hover style does not stick after a tap. */
button {
	width: 2.75rem;
	height: 2.75rem;
	border-color: var(--fui-line);
	background: transparent;
	color: var(--fui-ink-muted);
}
button.selected {
	border-color: var(--fui-accent);
	background: var(--fui-surface-raised);
	color: var(--fui-ink);
	font-weight: 700;
}
.result {
	color: var(--fui-ink);
	font-weight: 600;
}
</style>
