<script lang="ts">
import { untrack } from "svelte";
import AmplitudeChart from "../../quantum/AmplitudeChart.svelte";
import { keyEdit, normalise, type Preset, presets, withAmplitude } from "../../quantum/drawing.ts";
import { ket, listAmplitudes } from "../../quantum/format.ts";
import {
	type Amplitudes,
	bitstring,
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
const labels = $derived(drawn.map((_, index) => bitstring(index, count)));
const input = $derived(stroke ?? drawn);
const output = $derived(transform((stroke && normalise(stroke)) ?? drawn));

function commit(next: readonly number[]): boolean {
	const state = normalise(next);
	if (!state) return false;
	stroke = undefined;
	sketch = next;
	drawn = state;
	const names = state.map((_, index) => bitstring(index, qubitCount(state)));
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
			Apply H<sup>&otimes;{count}</sup>
		</button>
	</div>
	<div class="states">
		<div class="state">
			<p class="title">{ket("ψ")} <span class="hint">draw</span></p>
			<AmplitudeChart
				name="Amplitudes of the state, drawable"
				{labels}
				amplitudes={input}
				probabilities={probabilities(normalise(input) ?? drawn)}
				ondraw={draw}
				ondrawend={finishStroke}
				onkey={pressKey}
			/>
		</div>
		<div class="state">
			<p class="title">H<sup>&otimes;{count}</sup>{ket("ψ")}</p>
			<AmplitudeChart
				name="Amplitudes after a Hadamard gate on every qubit"
				{labels}
				amplitudes={output}
				probabilities={probabilities(output)}
			/>
		</div>
	</div>
	{#snippet caption()}
		<p class="spoken">{announcement}</p>
		<p class="legend">
			<span><span class="swatch plus" aria-hidden="true"></span>positive</span>
			<span><span class="swatch minus" aria-hidden="true"></span>negative</span>
			<span><span class="swatch chance" aria-hidden="true"></span>probability</span>
		</p>
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
button {
	min-height: 2.75rem;
	padding: 0 0.875rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	cursor: pointer;
}
button.square {
	width: 2.75rem;
	padding: 0;
}
button.apply {
	border-color: var(--fui-accent);
	font-weight: 600;
}
button:not([aria-disabled="true"]):hover {
	border-color: var(--fui-accent);
	background: var(--fui-surface-raised);
}
button[aria-disabled="true"] {
	border-style: dashed;
	color: var(--fui-ink-muted);
	opacity: 0.45;
	cursor: not-allowed;
}
button:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
sup {
	font-size: 0.75em;
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
.hint {
	margin-left: 0.5rem;
	font-size: 0.75rem;
	color: var(--fui-ink-muted);
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
.legend {
	margin: 0;
	display: flex;
	flex-wrap: wrap;
	gap: 0 1rem;
}
.legend > span {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
}
.swatch {
	width: 0.75rem;
	height: 0.75rem;
	border-radius: var(--fui-radius-xs);
}
.swatch.plus {
	background: var(--fui-accent);
}
.swatch.minus {
	background: var(--fui-code-warm);
}
.swatch.chance {
	border: 1px solid var(--fui-line);
	background: linear-gradient(to right, transparent, var(--fui-ink));
}
@media print {
	button,
	.hint {
		display: none;
	}
	.swatch {
		print-color-adjust: exact;
	}
}
</style>
