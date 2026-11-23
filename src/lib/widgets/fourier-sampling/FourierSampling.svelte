<script lang="ts">
import { untrack } from "svelte";
import { formatAmplitude, minusSign } from "../../quantum/format.ts";
import SignedBar from "../../quantum/SignedBar.svelte";
import { type Amplitudes, bitstrings } from "../../quantum/state.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import {
	depthBelowZero,
	describeMeasurement,
	describeOutcomes,
	emptyTally,
	formatExactProbability,
	fourierSampling,
	measure,
	type PresetName,
	presetNames,
	presetTable,
	recorded,
	sameTable,
	type TruthTable,
	toggled,
} from "./circuit.ts";
import type definition from "./definition.ts";

interface Stage {
	title: string;
	name: string;
	state: Amplitudes;
}

const mostColumnsWithNumbers = 8;
const mostColumnsAtFullSize = 4;
const presetLabels: Record<PresetName, string> = {
	and: "AND",
	parity: "Parity",
	constant: "Constant 0",
	balanced: "Balanced",
	"one-marked": "One marked",
};

const { qubits, preset }: WidgetProps<typeof definition> = $props();

let table = $state.raw<TruthTable>(untrack(() => presetTable(preset, qubits)));
let tally = $state.raw(emptyTally(2 ** untrack(() => qubits)));
let latest = $state<number>();

const labels = $derived(bitstrings(qubits));
const stages = $derived(fourierSampling(table));
const rows = $derived<Stage[]>([
	{ title: "H", name: "Amplitudes after H", state: stages.afterHadamard },
	{ title: "query", name: "Amplitudes after the query", state: stages.afterQuery },
	{
		title: "H again",
		name: "Amplitudes and probabilities after H again",
		state: stages.afterSecondHadamard,
	},
]);
const dense = $derived(table.length > mostColumnsWithNumbers);
const crowded = $derived(table.length > mostColumnsAtFullSize);

const chance = (amplitude: number): string => formatExactProbability(amplitude ** 2, qubits);

function setTable(next: TruthTable): void {
	table = next;
	tally = emptyTally(next.length);
	latest = undefined;
}

function measureOnce(): void {
	latest = measure(stages.afterSecondHadamard, Math.random);
	tally = recorded(tally, latest);
}
</script>

<WidgetFrame>
	<div class="board" class:crowded class:dense style:--columns={table.length}>
		<div class="row level">
			<p class="symbol" aria-hidden="true">f</p>
			<div class="truth">
				<div
					class="table"
					class:wraps={crowded}
					role="group"
					aria-label="Truth table of f"
					style:--per-row={Math.min(table.length, mostColumnsWithNumbers)}
				>
					{#each table as value, input (input)}
						<button
							type="button"
							class="value"
							class:one={value === 1}
							aria-label="f of {labels[input]} = {value}"
							onclick={() => setTable(toggled(table, input))}
						>
							<span class="input">{labels[input]}</span>{" "}<span class="bit">{value}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
		<div class="presets" role="group" aria-label="Presets">
			{#each presetNames as name (name)}
				<button
					type="button"
					aria-pressed={sameTable(table, presetTable(name, qubits))}
					onclick={() => setTable(presetTable(name, qubits))}
				>
					{presetLabels[name]}
				</button>
			{/each}
		</div>
		{#each rows as row (row.title)}
			<div class="row">
				<p class="symbol title">{row.title}</p>
				<div
					class="cells"
					role="list"
					aria-label={row.name}
					style:--below={depthBelowZero(row.state)}
				>
					{#each row.state as amplitude, outcome (outcome)}
						{@const shown = formatAmplitude(amplitude)}
						<div class="cell" role="listitem">
							<span class="spoken">
								{labels[outcome]}: amplitude {shown}, probability {chance(amplitude)}
							</span>
							<span class="plot" aria-hidden="true">
								<SignedBar {amplitude} />
							</span>
							{#if !dense}
								<span
									class="amplitude"
									class:negative={shown.startsWith(minusSign)}
									aria-hidden="true"
								>
									{#if shown.startsWith("+")}<span class="plus">+</span>{shown.slice(1)}{:else}{shown}{/if}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
		<div class="row level" aria-hidden="true">
			<p class="symbol">Pr</p>
			<div class="cells">
				{#each stages.afterSecondHadamard as amplitude, outcome (outcome)}
					<span class="chance" style:--chance={amplitude ** 2}>
						{#if !dense}{chance(amplitude)}{/if}
					</span>
				{/each}
			</div>
		</div>
		<div class="row" aria-hidden="true">
			<div class="cells labels">
				{#each labels as label (label)}
					<span>{label}</span>
				{/each}
			</div>
		</div>
		<div class="row level">
			<div class="measurement">
				<button type="button" class="measure" onclick={measureOnce}>Measure</button>
				<p class="spoken" aria-live="polite">
					{#if latest !== undefined}{describeMeasurement(labels[latest] ?? "", tally, latest)}{/if}
				</p>
			</div>
			<div class="cells tally" role="list" aria-label="Tally of outcomes">
				{#each tally as count, outcome (outcome)}
					<span class="cell" class:latest={outcome === latest} role="listitem">
						<span class="spoken">{labels[outcome]}: {count}</span>
						{#if count > 0}<span class="count" aria-hidden="true">{count}</span>{/if}
					</span>
				{/each}
			</div>
		</div>
	</div>
	{#snippet caption()}
		<p class="spoken">{describeOutcomes(stages.afterSecondHadamard)}</p>
	{/snippet}
</WidgetFrame>

<style>
.board {
	width: 100%;
	container-type: inline-size;
	display: grid;
	gap: 0.625rem;
	--unit: 2rem;
	--gutter: 6.5rem;
	--title-line: 1.25rem;
	/* Four columns are drawn as wide as eight, so two qubits fill the width that three do. */
	--plot: max(26rem, var(--columns) * 3.25rem);
}
.row {
	display: grid;
	grid-template-columns: var(--gutter) minmax(0, var(--plot));
	gap: 0.25rem 0.5rem;
	align-items: start;
}
.row.level {
	align-items: center;
}
.row > :last-child {
	grid-column: -2 / -1;
}
.symbol {
	font-family: var(--fui-font-mono);
	font-size: 0.875rem;
	line-height: var(--title-line);
	color: var(--fui-ink);
	text-align: end;
}
/* Beside its plot, a title sits on the axis, which is one unit down. */
.title {
	margin-top: calc(var(--unit) - var(--title-line));
}
.truth {
	width: 100%;
	container-type: inline-size;
}
.table {
	width: min(100%, 26rem);
	display: grid;
	grid-template-columns: repeat(var(--per-row), minmax(0, 1fr));
	gap: 0.25rem 2px;
}
/* Eight values in a row are 2.75rem wide each only from 23rem up; below it they take four a row. */
@container (width < 23rem) {
	.table.wraps {
		width: min(100%, 13rem);
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
}
.presets,
.measurement {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.375rem;
}
button {
	padding: 0 0.75rem;
}
button[aria-pressed="true"] {
	border-color: var(--fui-accent);
	box-shadow: inset 0 -2px 0 var(--fui-accent);
	font-weight: 600;
}
button.value {
	padding: 0.25rem 0;
	display: grid;
	justify-items: center;
	align-content: center;
	font-family: var(--fui-font-mono);
	line-height: 1.2;
}
.input {
	font-size: 0.6875rem;
	color: var(--fui-ink-secondary);
}
.bit {
	font-size: 1.125rem;
	color: var(--fui-ink-muted);
}
button.one {
	border-color: var(--fui-accent);
	background: color-mix(in oklab, var(--fui-accent) 18%, transparent);
}
button.one:hover {
	background: color-mix(in oklab, var(--fui-accent) 28%, transparent);
}
.one .bit {
	color: var(--fui-accent-strong);
	font-weight: 700;
}
button.measure {
	flex: 1;
	border-color: var(--fui-accent);
	font-weight: 600;
}
p {
	margin: 0;
}
.cells {
	display: grid;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
	justify-items: center;
	font-family: var(--fui-font-mono);
	font-size: 0.6875rem;
	font-variant-numeric: tabular-nums;
	line-height: 1.5;
	color: var(--fui-ink);
}
.cell {
	position: relative;
	width: 100%;
	display: grid;
	justify-items: center;
	align-content: start;
	gap: 0.125rem;
}
.plot {
	position: relative;
	width: 100%;
	height: calc(var(--unit) * (1 + var(--below)));
	background: linear-gradient(var(--fui-ink-muted), var(--fui-ink-muted)) 0 var(--unit) / 100% 1px
		no-repeat;
	transition: height 250ms ease-out;
}
.plot :global(.bar) {
	inset: 0 18% auto;
	height: var(--unit);
}
.dense .plot :global(.bar) {
	inset-inline: 10%;
}
.amplitude {
	color: var(--fui-accent-strong);
	white-space: nowrap;
}
.amplitude.negative {
	color: var(--fui-code-warm);
}
.chance {
	width: calc(100% - 4px);
	min-height: 1.375rem;
	display: grid;
	place-items: center;
	border-radius: var(--fui-radius-xs);
	background: color-mix(
		in oklab,
		var(--fui-ink) calc(var(--chance) * var(--deepest-shade, 25%)),
		transparent
	);
	white-space: nowrap;
	transition: background-color 250ms ease-out;
}
/* With no number on it, the shade alone carries the probability and may run to solid. */
.dense .chance {
	--deepest-shade: 100%;
	min-height: 1.125rem;
}
.crowded .amplitude,
.crowded .chance {
	font-size: 0.625rem;
	letter-spacing: -0.03em;
}
.labels {
	color: var(--fui-ink-secondary);
}
.dense .labels > span {
	writing-mode: vertical-rl;
	line-height: 1;
}
.tally {
	font-size: 0.8125rem;
	min-height: 1.5em;
}
.dense .tally {
	font-size: 0.625rem;
	letter-spacing: -0.03em;
}
.latest .count {
	color: var(--fui-accent-strong);
	font-weight: 700;
	box-shadow: 0 2px 0 var(--fui-accent);
}
/* Too narrow for a gutter: each symbol goes above its row, and a crowded row drops its plus signs. */
@container (width < 30rem) {
	.row {
		grid-template-columns: minmax(0, var(--plot));
	}
	.symbol {
		margin-top: 0;
		text-align: start;
	}
	button.measure {
		flex: none;
	}
	.crowded .plus {
		display: none;
	}
}
@media (prefers-reduced-motion: reduce) {
	.plot,
	.chance {
		transition: none;
	}
}
@media print {
	.presets,
	.measurement {
		display: none;
	}
	.one,
	.chance {
		print-color-adjust: exact;
	}
}
</style>
