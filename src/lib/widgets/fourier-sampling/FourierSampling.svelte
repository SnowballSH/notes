<script lang="ts">
import { untrack } from "svelte";
import AmplitudeChart from "../../quantum/AmplitudeChart.svelte";
import type { Random } from "../../quantum/sampling.ts";
import { bitstring, probabilities } from "../../quantum/state.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import {
	describeOutcomes,
	emptyTally,
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

const mostColumnsWithNumbers = 8;
const presetLabels: Record<PresetName, string> = {
	and: "AND",
	parity: "Parity",
	constant: "Constant 0",
	balanced: "Balanced",
	"one-marked": "One marked",
};

const {
	qubits,
	preset,
	random = Math.random,
}: WidgetProps<typeof definition> & { random?: Random } = $props();

let table = $state.raw<TruthTable>(untrack(() => presetTable(preset, qubits)));
let tally = $state.raw(emptyTally(2 ** untrack(() => qubits)));
let latest = $state<number>();

const labels = $derived(table.map((_, input) => bitstring(input, qubits)));
const stages = $derived(fourierSampling(table));
const dense = $derived(table.length > mostColumnsWithNumbers);

function setTable(next: TruthTable): void {
	table = next;
	tally = emptyTally(next.length);
	latest = undefined;
}

function measureOnce(): void {
	latest = measure(stages.afterSecondHadamard, random);
	tally = recorded(tally, latest);
}
</script>

<WidgetFrame>
	<div class="truth">
		<div
			class="table"
			role="group"
			aria-label="Truth table of f"
			style:--columns={Math.min(table.length, mostColumnsWithNumbers)}
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
	<div class="stages" style:--columns={table.length}>
		<section class="stage amplitudes-only">
			<p class="title">H</p>
			<AmplitudeChart
				name="Amplitudes after H"
				{labels}
				amplitudes={stages.afterHadamard}
				probabilities={probabilities(stages.afterHadamard)}
				{dense}
			/>
		</section>
		<section class="stage amplitudes-only">
			<p class="title">query</p>
			<AmplitudeChart
				name="Amplitudes after the query"
				{labels}
				amplitudes={stages.afterQuery}
				probabilities={probabilities(stages.afterQuery)}
				{dense}
			/>
		</section>
		<section class="stage">
			<p class="title">H again</p>
			<AmplitudeChart
				name="Amplitudes and probabilities after H again"
				{labels}
				amplitudes={stages.afterSecondHadamard}
				probabilities={probabilities(stages.afterSecondHadamard)}
				showProbabilityValues
				{dense}
			/>
			<div class="tally" class:dense role="list" aria-label="Tally of outcomes">
				{#each tally as count, outcome (outcome)}
					<span role="listitem" class:latest={outcome === latest}>
						<span class="spoken">{labels[outcome]}: {count}</span>
						{#if count > 0}<span aria-hidden="true">×{count}</span>{/if}
					</span>
				{/each}
			</div>
			<div class="measurement">
				<button type="button" class="measure" onclick={measureOnce}>Measure</button>
				<p class="spoken" aria-live="polite">
					{#if latest !== undefined}Measured {labels[latest]}.{/if}
				</p>
			</div>
		</section>
	</div>
	{#snippet caption()}
		<p class="spoken">{describeOutcomes(stages.afterSecondHadamard)}</p>
	{/snippet}
</WidgetFrame>

<style>
.truth {
	width: 100%;
	container-type: inline-size;
}
.table {
	width: min(100%, var(--columns) * 3.25rem);
	display: grid;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
	gap: 0.25rem 2px;
}
/* Eight values in a row are 2.75rem wide each only from 23rem up; below it they take four a row. */
@container (width < 23rem) {
	.table {
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
	min-height: 2.75rem;
	padding: 0 0.75rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	cursor: pointer;
}
button:hover {
	border-color: var(--fui-accent);
	background: var(--fui-surface-raised);
}
button:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
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
	border-color: var(--fui-accent);
	font-weight: 600;
}
p {
	margin: 0;
}
.stages {
	width: 100%;
	display: grid;
	gap: 0.75rem;
	--chart-unit: 2rem;
}
.stage {
	display: grid;
	gap: 0.375rem;
	justify-items: start;
}
.amplitudes-only :global(.chance) {
	display: none;
}
.title {
	font-family: var(--fui-font-mono);
	font-size: 0.875rem;
	color: var(--fui-ink);
}
.tally {
	width: min(100%, var(--columns) * 3.25rem);
	display: grid;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
	justify-items: center;
	font-family: var(--fui-font-mono);
	font-size: 0.8125rem;
	font-variant-numeric: tabular-nums;
	line-height: 1.5;
	color: var(--fui-ink);
}
.tally.dense {
	font-size: 0.625rem;
	letter-spacing: -0.03em;
}
.tally > span {
	position: relative;
	min-height: 1.5em;
}
.tally > .latest {
	color: var(--fui-accent-strong);
	font-weight: 700;
	box-shadow: 0 2px 0 var(--fui-accent);
}
.spoken {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: 0;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
@media print {
	.presets,
	.measurement {
		display: none;
	}
	.one {
		print-color-adjust: exact;
	}
}
</style>
