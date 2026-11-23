<script lang="ts">
import { untrack } from "svelte";
import AmplitudeChart from "../../quantum/AmplitudeChart.svelte";
import {
	keyEdit,
	normalise,
	type Preset,
	plotPosition,
	presets,
	withAmplitude,
} from "../../quantum/drawing.ts";
import { ket, listAmplitudes } from "../../quantum/format.ts";
import {
	type Amplitudes,
	bitstrings,
	hadamardOnEveryQubit,
	probabilities,
	qubitCount,
	settled,
} from "../../quantum/state.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import { mostQubits } from "./definition.ts";

const { qubits }: WidgetProps<typeof definition> = $props();
const initial = presets.basis(2 ** untrack(() => qubits));

/** The drawing as its bars were last set: keys edit it, and the state is its normalisation. */
let sketch = $state.raw<readonly number[]>(initial);
let drawn = $state.raw<Amplitudes>(initial);
let stroke = $state.raw<readonly number[]>();
let announcement = $state("");

const transform = (state: Amplitudes): Amplitudes => settled(hadamardOnEveryQubit(state));

const count = $derived(qubitCount(drawn));
const labels = $derived(bitstrings(count));
const input = $derived(stroke ?? drawn);
const output = $derived(transform((stroke && normalise(stroke)) ?? drawn));

function commit(next: readonly number[]): boolean {
	const state = normalise(next);
	if (!state) return false;
	stroke = undefined;
	sketch = next;
	drawn = state;
	const names = bitstrings(qubitCount(state));
	announcement = `State: ${listAmplitudes(names, state)}. After H: ${listAmplitudes(names, transform(state))}.`;
	return true;
}

function resize(by: 1 | -1): void {
	const next = count + by;
	if (next >= 1 && next <= mostQubits) commit(presets.basis(2 ** next));
}

function choose(preset: Preset): void {
	commit(presets[preset](drawn.length));
}

function draw(index: number, amplitude: number): void {
	stroke = withAmplitude(stroke ?? drawn, index, amplitude);
}

function finishStroke(): void {
	const finished = stroke;
	stroke = undefined;
	if (finished?.length === drawn.length) commit(normalise(finished) ?? drawn);
}

function pressKey(index: number, key: string): boolean {
	const edited = keyEdit(sketch, index, key);
	return edited !== undefined && commit(edited);
}

function applyGates(): void {
	commit(transform(drawn));
}
</script>

<WidgetFrame>
	<div class="controls">
		<div class="row" role="group" aria-label="Number of qubits">
			<button
				type="button"
				class="square"
				aria-label="Fewer qubits"
				aria-disabled={count <= 1}
				onclick={() => resize(-1)}>&minus;</button
			>
			<span class="count" aria-live="polite">n = {count}</span>
			<button
				type="button"
				class="square"
				aria-label="More qubits"
				aria-disabled={count >= mostQubits}
				onclick={() => resize(1)}>+</button
			>
		</div>
		<div class="row" role="group" aria-label="Presets">
			<button type="button" onclick={() => choose("basis")}>{ket("0".repeat(count))}</button>
			<button type="button" onclick={() => choose("uniform")}>Uniform</button>
			<button type="button" onclick={() => choose("alternating")}>+ &minus; + &minus;</button>
		</div>
		<button type="button" class="apply" onclick={applyGates}>
			Apply H<sup class="power">&otimes;{count}</sup>
		</button>
	</div>
	<div class="states">
		<div class="state">
			<p class="title">{ket("ψ")}</p>
			<div class="sketch" class:dragging={stroke !== undefined} style:--columns={input.length}>
				<AmplitudeChart
					name="Amplitudes of the state, drawable"
					{labels}
					amplitudes={input}
					probabilities={probabilities(normalise(input) ?? drawn)}
					showProbabilityValues
					ondraw={draw}
					ondrawend={finishStroke}
					onkey={pressKey}
				/>
				{#each input as amplitude, index (index)}
					<span
						class="grip"
						style:--across={(index + 0.5) / input.length}
						style:--down={plotPosition(amplitude)}
						aria-hidden="true"
					></span>
				{/each}
			</div>
		</div>
		<div class="state">
			<p class="title">H<sup class="power">&otimes;{count}</sup>{ket("ψ")}</p>
			<AmplitudeChart
				name="Amplitudes after a Hadamard gate on every qubit"
				{labels}
				amplitudes={output}
				probabilities={probabilities(output)}
				showProbabilityValues
			/>
		</div>
	</div>
	{#snippet caption()}
		<p class="spoken">{announcement}</p>
	{/snippet}
</WidgetFrame>

<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem 1.5rem;
}
.row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.375rem;
}
.count {
	min-width: 3.5rem;
	text-align: center;
	font-family: var(--fui-font-mono);
}
/* Restating the resting border and background keeps the frame's hover style off touch screens, where it would stay after a tap. */
button {
	padding: 0 0.875rem;
	border-color: var(--fui-line);
	background: transparent;
}
button.square {
	width: 2.75rem;
	padding: 0;
}
button.apply {
	border-color: var(--fui-accent);
	font-weight: 600;
}
@media (hover: hover) {
	button:not([aria-disabled="true"]):hover {
		border-color: var(--fui-accent);
		background: var(--fui-surface-raised);
	}
}
.power {
	font-family: "STIX Two Math", math;
	font-size: 0.85em;
	font-weight: 400;
	line-height: 0;
}
.states {
	width: 100%;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
	gap: 0.75rem;
}
.state {
	display: grid;
	gap: 0.5rem;
	justify-items: center;
	align-content: start;
	/* Narrower than the label it holds, which runs into the padding: eight columns need the width. */
	--chart-gutter: 0.75rem;
	padding: 0.75rem 0.5rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-md);
}
.title {
	margin: 0;
	justify-self: start;
	padding-left: 0.375rem;
	font-family: var(--fui-font-mono);
	color: var(--fui-ink);
}
.sketch {
	--chart-unit: 4.5rem;
	position: relative;
	width: min(100%, var(--columns) * 3.25rem + var(--chart-gutter));
}
.sketch :global(.chart.drawable .column:hover) {
	background: transparent;
}
.grip {
	position: absolute;
	left: calc(var(--chart-gutter) + var(--across) * (100% - var(--chart-gutter)));
	top: calc(var(--down) * 2 * var(--chart-unit));
	width: 0.75rem;
	height: 0.25rem;
	border: 1px solid var(--fui-ink);
	border-radius: var(--fui-radius-xs);
	background: var(--fui-surface-base);
	transform: translate(-50%, -50%);
	pointer-events: none;
	transition: top 250ms ease-out;
}
.dragging .grip {
	transition: none;
}
@media (prefers-reduced-motion: reduce) {
	.grip {
		transition: none;
	}
}
@media print {
	button,
	.grip {
		display: none;
	}
}
</style>
