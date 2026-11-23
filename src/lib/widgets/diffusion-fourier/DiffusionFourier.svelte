<script lang="ts">
import { untrack } from "svelte";
import AmplitudeChart from "../../quantum/AmplitudeChart.svelte";
import { keyEdit, normalise, withAmplitude } from "../../quantum/drawing.ts";
import { listAmplitudes } from "../../quantum/format.ts";
import { mean } from "../../quantum/grover.ts";
import { type Amplitudes, bitstrings, probabilities } from "../../quantum/state.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import {
	afterQueryingAnd,
	averageLabel,
	barBox,
	describeAverage,
	diffuse,
	isSameState,
	scaledAverageLabel,
	scaledFourierCoefficients,
} from "./diffusion.ts";

const { qubits }: WidgetProps<typeof definition> = $props();
const count = untrack(() => qubits);
const initial = afterQueryingAnd(count);
const labels = bitstrings(count);
const zeroColumn = [0];

/** The drawing as its bars were last set: keys edit it, and the state is its normalisation. */
let sketch = $state.raw<readonly number[]>(initial);
let drawn = $state.raw<Amplitudes>(initial);
let stroke = $state.raw<readonly number[]>();
let beforeD = $state.raw<Amplitudes>();
let announcement = $state("");

const input = $derived(stroke ?? drawn);
const current = $derived((stroke && normalise(stroke)) ?? drawn);
const coefficients = $derived(scaledFourierCoefficients(current));
const untouched = $derived(stroke === undefined && isSameState(drawn, initial));

function commit(next: readonly number[]): boolean {
	const normalised = normalise(next);
	if (!normalised) return false;
	stroke = undefined;
	beforeD = undefined;
	sketch = next;
	drawn = normalised;
	announcement = `Amplitudes: ${listAmplitudes(labels, normalised)}. Fourier coefficients times √N: ${listAmplitudes(labels, scaledFourierCoefficients(normalised))}.`;
	return true;
}

function applyD(): void {
	const before = drawn;
	if (commit(diffuse(before))) beforeD = before;
}

function startOver(): void {
	if (!untouched) commit(initial);
}

function draw(index: number, amplitude: number): void {
	beforeD = undefined;
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

{#snippet ghosts(before: Amplitudes)}
	<div class="ghosts" style:--columns={before.length} aria-hidden="true">
		{#each before as amplitude, index (index)}
			{@const box = barBox(amplitude)}
			<span class="cell">
				{#if box.height > 0}
					<span class="ghost" style:top="{box.top}%" style:height="{box.height}%"></span>
				{/if}
			</span>
		{/each}
	</div>
{/snippet}

<WidgetFrame>
	<div class="controls">
		<button type="button" class="apply" onclick={applyD}>Apply D</button>
		<button type="button" aria-disabled={untouched} onclick={startOver}>Start over</button>
	</div>
	<div class="charts">
		<div class="panel" class:crowded={count > 2}>
			<p class="title">a(x)</p>
			<div class="plots">
				<AmplitudeChart
					name="Amplitudes of the state, drawable"
					{labels}
					amplitudes={input}
					probabilities={probabilities(current)}
					showProbabilityCells={false}
					level={{ value: mean(input), label: averageLabel(input) }}
					ondraw={draw}
					ondrawend={finishStroke}
					onkey={pressKey}
				/>
				{#if beforeD}{@render ghosts(beforeD)}{/if}
			</div>
		</div>
		<div class="panel" class:crowded={count > 2}>
			<p class="title">&radic;N&middot;&acirc;(&gamma;)</p>
			<div class="plots">
				<AmplitudeChart
					name="Fourier coefficients of the amplitudes, times √N"
					{labels}
					amplitudes={coefficients}
					probabilities={probabilities(coefficients)}
					showProbabilityCells={false}
					highlighted={zeroColumn}
					level={{ value: coefficients[0] ?? 0, label: scaledAverageLabel }}
				/>
				{#if beforeD}{@render ghosts(scaledFourierCoefficients(beforeD))}{/if}
			</div>
		</div>
	</div>
	<p class="spoken" aria-live="polite">{announcement} {describeAverage(drawn)}</p>
</WidgetFrame>

<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}
button {
	padding: 0 1rem;
}
button.apply {
	border-color: var(--fui-accent);
	font-weight: 600;
}
p {
	margin: 0;
}
.charts {
	width: min(100%, 30rem);
	display: grid;
	gap: 0.75rem;
	container-type: inline-size;
}
.panel {
	--chart-unit: 3.5rem;
	--gutter: 4.5rem;
	display: grid;
	gap: 0.5rem;
	padding: 0.75rem 0.5rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-md);
}
.title {
	justify-self: stretch;
	padding-inline: 0.375rem;
	font-weight: 600;
	line-height: 1.75rem;
	color: var(--fui-ink);
}
.plots {
	position: relative;
	margin-inline-end: var(--gutter);
}
.plots :global(.chart) {
	width: 100%;
}
.plots :global(.level-label) {
	inset: 0 auto auto 100%;
	transform: translateY(-50%);
	padding-inline-start: 0.375rem;
	font-size: 0.75rem;
	color: var(--fui-ink);
}
.ghosts {
	position: absolute;
	inset: 0 0 auto;
	height: calc(2 * var(--chart-unit));
	display: grid;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
	pointer-events: none;
}
.cell {
	position: relative;
}
.ghost {
	position: absolute;
	inset-inline: 18%;
	border: 1px dashed var(--fui-ink-muted);
	border-radius: var(--fui-radius-xs);
}
/* Eight columns and the gutter do not both fit a phone, so there the label sits on the line's end. */
@container (max-width: 22rem) {
	.crowded {
		--gutter: 0rem;
	}
	.crowded .plots :global(.level-label) {
		inset: auto 0 2px auto;
		transform: none;
		padding-inline: 0.125rem;
		background: var(--fui-surface-base);
	}
}
@media print {
	button {
		display: none;
	}
}
</style>
