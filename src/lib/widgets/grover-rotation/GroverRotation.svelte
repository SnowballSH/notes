<script lang="ts">
import { untrack } from "svelte";
import { cubicInOut } from "svelte/easing";
import { prefersReducedMotion, Tween } from "svelte/motion";
import { bestIterations } from "../../quantum/grover.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import { fewestQubits, mostQubits } from "./definition.ts";
import {
	arcPath,
	arrowBase,
	arrowHead,
	centre,
	height,
	heightSquare,
	labelAcrossAxisFrom,
	labelOutside,
	pointAt,
	radius,
	turnLabelPoint,
	width,
} from "./layout.ts";
import {
	caption as captionText,
	clampMarked,
	describe,
	describePicture,
	formatProbability,
	lastIteration,
	mostMarked,
	stateAngle,
	turnLabel,
} from "./rotation.ts";

const props: WidgetProps<typeof definition> = $props();

const turnTime = 450;
const arcDistance = 48;
const tickReach = 6;
const axisOverhang = 12;

let qubits = $state(untrack(() => props.qubits));
let marked = $state(untrack(() => clampMarked(props.marked, props.qubits)));
let iterations = $state(0);

const size = $derived(2 ** qubits);
const best = $derived(bestIterations(size, marked));
const last = $derived(lastIteration(size, marked));
const angle = $derived(stateAngle(size, marked, iterations));
const turnedFrom = $derived(iterations === 0 ? 0 : stateAngle(size, marked, iterations - 1));
const earlier = $derived(
	Array.from({ length: iterations }, (_, done) => stateAngle(size, marked, done)),
);
const bestAngle = $derived(stateAngle(size, marked, best));
const bestLabel = $derived(labelOutside(bestAngle));
const markedLabel = $derived(labelAcrossAxisFrom(bestAngle));

/** The arrow as drawn: it turns through 2θ to the next state. */
const shown = new Tween(
	untrack(() => angle),
	{ easing: cubicInOut },
);
const tip = $derived(pointAt(shown.current));
const shaftEnd = $derived(arrowBase(shown.current));
const square = $derived(heightSquare(shown.current));
const turnLabelAt = $derived(turnLabelPoint(turnedFrom, angle));

function goTo(next: number): void {
	if (next < 0 || next > last || next === iterations) return;
	iterations = next;
	shown.set(stateAngle(size, marked, next), {
		duration: prefersReducedMotion.current ? 0 : turnTime,
	});
}

function configure(nextQubits: number, nextMarked: number): void {
	qubits = nextQubits;
	marked = clampMarked(nextMarked, nextQubits);
	iterations = 0;
	shown.set(stateAngle(2 ** qubits, marked, 0), { duration: 0 });
}

function changeMarked(by: 1 | -1): void {
	if (clampMarked(marked + by, qubits) !== marked) configure(qubits, marked + by);
}
</script>

<WidgetFrame>
	<div class="controls">
		<div class="row">
			<button
				type="button"
				class="iterate"
				aria-disabled={iterations === last}
				onclick={() => goTo(iterations + 1)}>Iterate</button
			>
			<button type="button" aria-disabled={iterations === 0} onclick={() => goTo(iterations - 1)}>
				Back
			</button>
			<button type="button" aria-disabled={iterations === 0} onclick={() => goTo(0)}>
				Reset
			</button>
		</div>
		<div class="row settings">
			<label class="qubits">
				<span class="value">n = {qubits}</span>
				<input
					type="range"
					min={fewestQubits}
					max={mostQubits}
					step="1"
					value={qubits}
					aria-label="Number of qubits n"
					aria-valuetext="{qubits} qubits, {size} inputs"
					oninput={(event) => configure(event.currentTarget.valueAsNumber, marked)}
				/>
			</label>
			<div class="stepper" role="group" aria-label="Number of marked inputs k">
				<button
					type="button"
					aria-label="Fewer marked inputs"
					aria-disabled={marked === 1}
					onclick={() => changeMarked(-1)}>−</button
				>
				<span class="value">k = {marked}, N = {size}</span>
				<button
					type="button"
					aria-label="More marked inputs"
					aria-disabled={marked === mostMarked(qubits)}
					onclick={() => changeMarked(1)}>+</button
				>
			</div>
		</div>
	</div>
	<svg
		class="picture"
		viewBox="0 0 {width} {height}"
		role="img"
		aria-label={describePicture(qubits, marked, iterations)}
	>
		<rect class="square" x={square.x} y={square.y} width={square.side} height={square.side} />
		<line
			class="axis"
			x1={centre.x - radius - axisOverhang}
			y1={centre.y}
			x2={centre.x + radius + axisOverhang}
			y2={centre.y}
		/>
		<line class="axis" x1={centre.x} y1={centre.y} x2={centre.x} y2="4" />
		<path class="unit" d={arcPath(0, Math.PI, radius)} />
		<text class="axis-label" x={centre.x + radius + axisOverhang} y={height - 8} text-anchor="end">
			unmarked
		</text>
		<text class="axis-label" x={markedLabel.x} y={markedLabel.y} text-anchor={markedLabel.anchor}>
			marked
		</text>
		{#each earlier as past (past)}
			{@const point = pointAt(past)}
			<line class="earlier" x1={centre.x} y1={centre.y} x2={point.x} y2={point.y} />
			<circle class="earlier-dot" cx={point.x} cy={point.y} r="2.5" />
		{/each}
		<line
			class="best"
			x1={pointAt(bestAngle, radius - tickReach).x}
			y1={pointAt(bestAngle, radius - tickReach).y}
			x2={pointAt(bestAngle, radius + tickReach).x}
			y2={pointAt(bestAngle, radius + tickReach).y}
		/>
		<text class="best-label" x={bestLabel.x} y={bestLabel.y} text-anchor={bestLabel.anchor}>
			T = {best}
		</text>
		{#if shown.current > turnedFrom}
			<path class="turn" d={arcPath(turnedFrom, shown.current, arcDistance)} />
		{/if}
		<line class="rise" x1={tip.x} y1={centre.y} x2={tip.x} y2={tip.y} />
		<line class="arrow" x1={centre.x} y1={centre.y} x2={shaftEnd.x} y2={shaftEnd.y} />
		<polygon class="head" points={arrowHead(shown.current)} />
		<text class="turn-label" x={turnLabelAt.x} y={turnLabelAt.y}>{turnLabel(iterations)}</text>
		<text class="chance" x={square.x + square.side / 2} y={centre.y + 14}>
			{formatProbability(Math.sin(shown.current) ** 2)}
		</text>
	</svg>
	{#snippet caption()}
		<p class="spoken">{describe(qubits, marked, iterations)}</p>
		<p aria-hidden="true">{captionText(qubits, marked, iterations)}</p>
	{/snippet}
</WidgetFrame>

<style>
.controls {
	display: grid;
	gap: 0.5rem;
	max-width: 100%;
}
.row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}
.settings {
	column-gap: 1.25rem;
}
button {
	min-width: 2.75rem;
	min-height: 2.75rem;
	padding: 0 1rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	cursor: pointer;
}
button.iterate {
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
button:focus-visible,
input:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
.qubits,
.stepper {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
.stepper button {
	padding: 0;
	font-size: 1.125rem;
}
.value {
	font-family: var(--fui-font-mono);
	font-size: 0.875rem;
	font-variant-numeric: tabular-nums;
	color: var(--fui-ink);
	white-space: nowrap;
}
input[type="range"] {
	width: 7.5rem;
	height: 2.75rem;
	margin: 0;
	accent-color: var(--fui-accent);
	cursor: pointer;
}
.picture {
	display: block;
	width: 100%;
	max-width: 26rem;
	height: auto;
}
.axis {
	stroke: var(--fui-line);
	stroke-width: 1;
}
.unit {
	fill: none;
	stroke: var(--fui-ink-secondary);
	stroke-width: 1.5;
}
text {
	font-family: var(--fui-font-sans);
	font-size: 11px;
	dominant-baseline: central;
	/* A halo in the page colour, so the lines that cross a label break around it. */
	paint-order: stroke;
	stroke: var(--fui-surface-base);
	stroke-width: 3;
	stroke-linejoin: round;
}
.axis-label {
	fill: var(--fui-ink-secondary);
}
.earlier {
	stroke: var(--fui-ink-muted);
	stroke-width: 1;
	opacity: 0.35;
}
.earlier-dot {
	fill: var(--fui-ink-muted);
}
.best {
	stroke: var(--fui-code-warm);
	stroke-width: 3;
	stroke-linecap: round;
}
.best-label {
	fill: var(--fui-code-warm);
	font-family: var(--fui-font-mono);
	font-weight: 700;
}
.turn {
	fill: none;
	stroke: var(--fui-code-violet);
	stroke-width: 2;
	stroke-linecap: round;
}
.turn-label {
	fill: var(--fui-code-violet);
	font-family: var(--fui-font-mono);
	font-weight: 700;
	text-anchor: middle;
}
.square {
	fill: var(--fui-accent);
	opacity: 0.16;
}
.rise {
	stroke: var(--fui-accent);
	stroke-width: 4;
	stroke-linecap: round;
}
.arrow {
	stroke: var(--fui-ink);
	stroke-width: 2;
	stroke-linecap: round;
}
.head {
	fill: var(--fui-ink);
}
.chance {
	fill: var(--fui-accent-strong);
	font-family: var(--fui-font-mono);
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	text-anchor: middle;
}
p {
	margin: 0;
	font-family: var(--fui-font-mono);
	font-variant-numeric: tabular-nums;
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
	.controls {
		display: none;
	}
	.square,
	.rise {
		print-color-adjust: exact;
	}
}
</style>
