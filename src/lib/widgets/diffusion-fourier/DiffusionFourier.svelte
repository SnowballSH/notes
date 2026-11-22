<script lang="ts">
import { untrack } from "svelte";
import AmplitudeChart from "../../quantum/AmplitudeChart.svelte";
import { keyEdit, normalise, withAmplitude } from "../../quantum/drawing.ts";
import { listAmplitudes } from "../../quantum/format.ts";
import { mean } from "../../quantum/grover.ts";
import { type Amplitudes, bitstring, probabilities } from "../../quantum/state.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import {
	afterQueryingAnd,
	averageLabel,
	describeAverage,
	diffuse,
	isSameState,
	scaledFourierCoefficients,
} from "./diffusion.ts";

const { qubits }: WidgetProps<typeof definition> = $props();
const count = untrack(() => qubits);
const initial = afterQueryingAnd(count);
const labels = initial.map((_, index) => bitstring(index, count));
const zeroColumn = [0];

/** The drawing as its bars were last set: keys edit it, and the state is its normalisation. */
let sketch = $state.raw<readonly number[]>(initial);
let drawn = $state.raw<Amplitudes>(initial);
let stroke = $state.raw<readonly number[]>();
let announcement = $state("");

const input = $derived(stroke ?? drawn);
const current = $derived((stroke && normalise(stroke)) ?? drawn);
const coefficients = $derived(scaledFourierCoefficients(current));
const untouched = $derived(stroke === undefined && isSameState(drawn, initial));

function commit(next: readonly number[]): boolean {
	const normalised = normalise(next);
	if (!normalised) return false;
	stroke = undefined;
	sketch = next;
	drawn = normalised;
	announcement = `Amplitudes: ${listAmplitudes(labels, normalised)}. Fourier coefficients times √N: ${listAmplitudes(labels, scaledFourierCoefficients(normalised))}.`;
	return true;
}

function startOver(): void {
	if (!untouched) commit(initial);
}

function draw(index: number, amplitude: number): void {
	stroke = withAmplitude(stroke ?? drawn, index, amplitude);
}

function finishStroke(): void {
	const finished = stroke;
	stroke = undefined;
	if (finished) commit(normalise(finished) ?? drawn);
}

function pressKey(index: number, key: string): boolean {
	const edited = keyEdit(sketch, index, key);
	return edited !== undefined && commit(edited);
}
</script>

<WidgetFrame>
	<div class="controls">
		<button type="button" class="apply" onclick={() => commit(diffuse(drawn))}>Apply D</button>
		<button type="button" aria-disabled={untouched} onclick={startOver}>Start over</button>
	</div>
	<div class="charts">
		<div class="panel">
			<p class="title">Amplitudes</p>
			<AmplitudeChart
				name="Amplitudes of the state, drawable"
				{labels}
				amplitudes={input}
				probabilities={probabilities(current)}
				level={{ value: mean(input), label: "μ" }}
				ondraw={draw}
				ondrawend={finishStroke}
				onkey={pressKey}
			/>
		</div>
		<div class="panel">
			<p class="title">Fourier (&times;&radic;N)</p>
			<AmplitudeChart
				name="Fourier coefficients of the amplitudes, times √N"
				{labels}
				amplitudes={coefficients}
				probabilities={probabilities(coefficients)}
				highlighted={zeroColumn}
			/>
		</div>
	</div>
	{#snippet caption()}
		<p class="spoken">{announcement} {describeAverage(current)}</p>
		<p aria-hidden="true">{averageLabel(current)}</p>
	{/snippet}
</WidgetFrame>

<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}
button {
	min-height: 2.75rem;
	padding: 0 1rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	cursor: pointer;
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
p {
	margin: 0;
}
.charts {
	width: min(100%, 30rem);
	display: grid;
	gap: 0.75rem;
}
.panel {
	--chart-unit: 3.5rem;
	display: grid;
	gap: 0.5rem;
	justify-items: center;
	padding: 0.75rem 0.5rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-md);
}
.title {
	justify-self: stretch;
	padding-inline: 0.375rem;
	font-weight: 600;
	color: var(--fui-ink);
}
.spoken {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
@media print {
	button {
		display: none;
	}
}
</style>
