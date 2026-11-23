<script lang="ts">
import { untrack } from "svelte";
import { formatAmplitude } from "../../quantum/format.ts";
import SignedBar from "../../quantum/SignedBar.svelte";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import {
	coefficientSymbol,
	describeSpectrum,
	flipped,
	inputLabel,
	matchingPreset,
	polynomialTerms,
	presetNames,
	presets,
	spectrum,
	subsetLabel,
	type TruthTable,
} from "./spectrum.ts";

const { preset }: WidgetProps<typeof definition> = $props();

let table = $state.raw<TruthTable>(presets[untrack(() => preset)].table);

const coefficients = $derived(spectrum(table));
const terms = $derived(polynomialTerms(coefficients));
const chosen = $derived(matchingPreset(table));
</script>

<WidgetFrame>
	<div class="presets" role="group" aria-label="Functions">
		{#each presetNames as name (name)}
			<button
				type="button"
				class="preset"
				aria-pressed={chosen === name}
				onclick={() => (table = presets[name].table)}
			>
				{presets[name].name}
			</button>
		{/each}
	</div>
	<div class="table" role="group" aria-label="Truth table">
		{#each table as value, index (index)}
			<button
				type="button"
				class="tile"
				class:negative={value < 0}
				aria-label="f({inputLabel(index)}) = {formatAmplitude(value)}"
				onclick={() => (table = flipped(table, index))}
			>
				<span class="input">{inputLabel(index)}</span>
				<span class="value">{formatAmplitude(value)}</span>
			</button>
		{/each}
	</div>
	<div
		class="chart"
		role="img"
		aria-label="Fourier coefficients: {describeSpectrum(coefficients)}"
	>
		<span class="symbol">{coefficientSymbol}</span>
		{#each coefficients as { subset, value } (subsetLabel(subset))}
			{@const shown = formatAmplitude(value)}
			<div class="column" style:--coefficient={value}>
				<span class="plot">
					<SignedBar amplitude={value} />
					<span class="coefficient" class:negative={value < 0} class:zero={shown === "0"}>
						{shown}
					</span>
				</span>
				<span class="subset" class:empty={subset.length === 0}>{subsetLabel(subset)}</span>
			</div>
		{/each}
	</div>
	{#snippet caption()}
		<p class="polynomial">
			{"f = "}
			{#each terms as term, position (position)}
				<span class="term">{term}</span>{" "}
			{/each}
		</p>
	{/snippet}
</WidgetFrame>

<style>
.presets {
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
}
.preset {
	padding: 0 0.75rem;
}
.preset[aria-pressed="true"] {
	border-color: var(--fui-accent);
	box-shadow: inset 0 -2px 0 var(--fui-accent);
	font-weight: 600;
}
.table {
	width: min(100%, 26rem);
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 0.375rem;
}
.tile {
	--tone: var(--fui-accent);
	display: grid;
	justify-items: center;
	gap: 0.125rem;
	padding: 0.375rem 0;
	border-color: color-mix(in oklab, var(--tone) 55%, var(--fui-line));
	background: color-mix(in oklab, var(--tone) 16%, transparent);
	font-family: var(--fui-font-mono);
	line-height: 1.2;
	transition:
		background-color 200ms ease-out,
		border-color 200ms ease-out;
}
.tile.negative {
	--tone: var(--fui-code-warm);
}
.tile:hover {
	background: color-mix(in oklab, var(--tone) 30%, transparent);
}
.input {
	font-size: 0.75rem;
	color: var(--fui-ink-secondary);
	white-space: nowrap;
}
.value {
	font-size: 1.125rem;
	font-weight: 700;
	color: color-mix(in oklab, var(--tone) 70%, var(--fui-ink));
}
.chart {
	--unit: 2.75rem;
	--label: 1.125rem;
	width: min(100%, 26rem);
	display: grid;
	grid-template-columns: repeat(8, minmax(0, 1fr));
	font-size: 0.75rem;
	line-height: 1.5;
}
.symbol {
	grid-column: 1 / -1;
	color: var(--fui-ink-secondary);
	font-style: italic;
}
.column {
	display: grid;
	justify-items: center;
}
.plot {
	position: relative;
	width: 100%;
	height: calc(2 * (var(--unit) + var(--label)));
	background: linear-gradient(var(--fui-ink-muted), var(--fui-ink-muted)) center / 100% 1px
		no-repeat;
}
.plot :global(.bar) {
	inset: var(--label) 18% 50%;
}
.coefficient {
	position: absolute;
	bottom: 50%;
	left: 50%;
	/* The label rides the tip of its bar: above a positive one, below a negative one. */
	transform: translate(-50%, calc(var(--coefficient) * -1 * var(--unit)));
	transition: transform 250ms ease-out;
	font-family: var(--fui-font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--fui-accent-strong);
	white-space: nowrap;
}
.coefficient.negative {
	top: 50%;
	bottom: auto;
	color: var(--fui-code-warm);
}
.coefficient.zero {
	color: var(--fui-ink-muted);
}
.subset {
	color: var(--fui-ink-secondary);
	letter-spacing: -0.02em;
	white-space: nowrap;
}
.subset.empty {
	font-size: 1.25em;
	line-height: 1.2;
}
.polynomial {
	margin: 0;
	font-family: var(--fui-font-mono);
	color: var(--fui-ink);
}
.term {
	white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
	.tile,
	.coefficient {
		transition: none;
	}
}
@media print {
	.presets {
		display: none;
	}
	.tile {
		print-color-adjust: exact;
	}
}
</style>
