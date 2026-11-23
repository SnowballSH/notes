<script lang="ts">
import { untrack } from "svelte";
import { bestIterations } from "../../quantum/grover.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import { fewestQubits, mostQubits } from "./definition.ts";
import {
	annotate,
	chanceSymbol,
	chanceTicks,
	clampMarked,
	classicalBound,
	classicalLabel,
	classicalPath,
	curvePath,
	describePicture,
	dotRadius,
	groverPoints,
	keyedQuery,
	lastQuery,
	mostMarked,
	plot,
	queryAt,
	queryTicks,
	spokenSummary,
	textSize,
	xOf,
	yOf,
} from "./plot.ts";

const props: WidgetProps<typeof definition> = $props();

let qubits = $state(untrack(() => props.qubits));
let marked = $state(untrack(() => clampMarked(props.marked, 2 ** props.qubits)));
let queries = $state(untrack(() => bestIterations(2 ** props.qubits, marked)));
let announcement = $state(untrack(() => spokenSummary(2 ** props.qubits, marked, queries)));
let dragging = $state(false);
let picture = $state<SVGSVGElement>();
let shownWidth = $state(0);

const size = $derived(2 ** qubits);
const best = $derived(bestIterations(size, marked));
const last = $derived(lastQuery(size, marked));
const points = $derived(groverPoints(size, marked, last));
const curve = $derived(curvePath(size, marked, last));
const chosen = $derived(points[queries] ?? { queries: 0, chance: 0, x: xOf(0, last), y: yOf(0) });
const summary = $derived(spokenSummary(size, marked, queries));
const classicalAt = $derived(classicalLabel(size, last));
const bestAt = $derived(xOf(best, last));
const baseline = yOf(0);

function search(nextQubits: number, nextMarked: number): void {
	const nextSize = 2 ** nextQubits;
	qubits = nextQubits;
	marked = clampMarked(nextMarked, nextSize);
	queries = bestIterations(nextSize, marked);
	announcement = spokenSummary(nextSize, marked, queries);
}

// The slider speaks its own value, so the caption falls silent.
function choose(next: number): void {
	if (next === queries) return;
	queries = next;
	announcement = "";
}

function mark(by: 1 | -1): void {
	if (clampMarked(marked + by, size) !== marked) search(qubits, marked + by);
}

function pointTo(event: PointerEvent): void {
	const box = picture?.getBoundingClientRect();
	if (!box || box.width === 0) return;
	choose(queryAt(((event.clientX - box.left) / box.width) * plot.width, last));
}

function startDrag(event: PointerEvent & { currentTarget: SVGGElement }): void {
	if (!event.isPrimary || event.button !== 0) return;
	dragging = true;
	event.currentTarget.setPointerCapture(event.pointerId);
	pointTo(event);
}

function pressKey(event: KeyboardEvent): void {
	if (event.altKey || event.ctrlKey || event.metaKey) return;
	const next = keyedQuery(queries, event.key, last);
	if (next === undefined) return;
	event.preventDefault();
	choose(next);
}
</script>

<WidgetFrame>
	<div class="controls">
		<label class="qubits">
			<span class="value">n = {qubits}</span>
			<input
				type="range"
				aria-label="Number of qubits"
				min={fewestQubits}
				max={mostQubits}
				step="1"
				value={qubits}
				oninput={(event) => search(Number(event.currentTarget.value), marked)}
			/>
		</label>
		<div class="row" role="group" aria-label="Number of marked inputs">
			<button
				type="button"
				aria-label="Fewer marked inputs"
				aria-disabled={marked <= 1}
				onclick={() => mark(-1)}>&minus;</button
			>
			<span class="value marked">k = {marked}</span>
			<button
				type="button"
				aria-label="More marked inputs"
				aria-disabled={marked >= mostMarked(size)}
				onclick={() => mark(1)}>+</button
			>
		</div>
	</div>
	<div class="plot" bind:clientWidth={shownWidth}>
		<svg
			bind:this={picture}
			viewBox="0 0 {plot.width} {plot.height}"
			style:font-size="{textSize(shownWidth)}px"
			role="group"
			aria-label="Success probability of the search"
		>
			<g role="img" aria-label={describePicture(size, marked)}>
				{#each chanceTicks as tick (tick.value)}
					<line class="grid" x1={plot.left} y1={tick.at} x2={plot.width - plot.right} y2={tick.at} />
					<text class="tick" x={plot.left - 5} y={tick.at} text-anchor="end">{tick.label}</text>
				{/each}
				<text class="tick" x={chanceSymbol.x} y={chanceSymbol.y} text-anchor="end">P</text>
				{#each queryTicks(last) as tick (tick.value)}
					<line class="grid" x1={tick.at} y1={baseline} x2={tick.at} y2={baseline + 4} />
					<text class="tick" x={tick.at} y={baseline + 11} text-anchor="middle">{tick.label}</text>
				{/each}
				<text class="axis-name" x={(plot.left + plot.width - plot.right) / 2} y={plot.height - 6}>
					queries t
				</text>
				<line class="best" x1={bestAt} y1={plot.top - 3} x2={bestAt} y2={baseline} />
				<text class="best-label" x={bestAt} y={plot.top - 9}>T = {best}</text>
				{#if marked === 1}
					<path class="classical" d={classicalPath(size, last)} />
				{/if}
				<path class="curve" d={curve} />
				{#if marked === 1}
					<text class="classical-label" x={classicalAt.x} y={classicalAt.y}>classical</text>
				{/if}
				{#each points as point (point.queries)}
					<circle class="dot" cx={point.x} cy={point.y} r={dotRadius(last)} />
				{/each}
			</g>
			<g
				class="chooser"
				class:dragging
				role="slider"
				tabindex="0"
				aria-label="Number of queries"
				aria-valuemin={0}
				aria-valuemax={last}
				aria-valuenow={queries}
				aria-valuetext={summary}
				onpointerdown={startDrag}
				onpointermove={(event) => dragging && pointTo(event)}
				onpointerup={() => (dragging = false)}
				onpointercancel={() => (dragging = false)}
				onlostpointercapture={() => (dragging = false)}
				onkeydown={pressKey}
			>
				<rect
					class="reach"
					x="0"
					y="0"
					width={plot.width}
					height={plot.height}
				/>
				{#if queries !== best}
					<line class="drop" x1={chosen.x} y1={chosen.y} x2={chosen.x} y2={baseline} />
				{/if}
				{#if marked === 1}
					<circle
						class="chosen-classical"
						cx={chosen.x}
						cy={yOf(classicalBound(size, queries))}
						r="3.5"
					/>
				{/if}
				<circle class="ring" cx={chosen.x} cy={chosen.y} r="9" />
				<circle class="chosen" cx={chosen.x} cy={chosen.y} r="5" />
			</g>
		</svg>
	</div>
	{#snippet caption()}
		<p class="spoken">{announcement}</p>
		<p class="now" aria-hidden="true">{annotate(size, marked, queries)}</p>
	{/snippet}
</WidgetFrame>

<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.375rem 1.5rem;
	max-width: 100%;
}
.qubits,
.row {
	display: flex;
	align-items: center;
	gap: 0.375rem;
}
.value {
	min-width: 6ch;
	font-family: var(--fui-font-mono);
	font-size: 0.875rem;
	font-variant-numeric: tabular-nums;
	color: var(--fui-ink);
}
.value.marked {
	min-width: 4.5rem;
	text-align: center;
}
input[type="range"] {
	width: 9rem;
	max-width: 100%;
	min-width: 0;
	height: 2.75rem;
	margin: 0;
	accent-color: var(--fui-accent);
	cursor: pointer;
}
button {
	width: 2.75rem;
	padding: 0;
}
input:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
p {
	margin: 0;
}
.plot {
	width: 100%;
	max-width: 28rem;
}
svg {
	display: block;
	width: 100%;
	height: auto;
	user-select: none;
}
.grid {
	stroke: var(--fui-line);
	stroke-width: 1;
}
.tick,
.axis-name,
.best-label,
.classical-label {
	font-family: var(--fui-font-mono);
	fill: var(--fui-ink-secondary);
}
.tick {
	dominant-baseline: central;
}
.axis-name {
	font-family: var(--fui-font-sans);
	text-anchor: middle;
}
.curve {
	fill: none;
	stroke: color-mix(in oklab, var(--fui-accent) 45%, transparent);
	stroke-width: 1.25;
	stroke-linejoin: round;
	stroke-linecap: round;
}
.dot {
	fill: var(--fui-accent);
	stroke: var(--fui-surface-base);
	stroke-width: 0.75;
}
.classical {
	fill: none;
	stroke: var(--fui-ink-muted);
	stroke-width: 1.5;
	stroke-dasharray: 5 3;
}
.best {
	stroke: var(--fui-code-violet);
	stroke-width: 1.5;
	stroke-dasharray: 2 3;
}
.best-label {
	fill: var(--fui-code-violet);
	font-weight: 700;
	text-anchor: middle;
}
.classical-label {
	font-family: var(--fui-font-sans);
	fill: var(--fui-ink-muted);
	text-anchor: middle;
	/* A halo keeps the word readable where the curve passes behind it. */
	stroke: var(--fui-surface-base);
	stroke-width: 3;
	paint-order: stroke;
}
.chooser {
	cursor: pointer;
	/* A sideways drag picks a number of queries; an up or down one still scrolls the page. */
	touch-action: pan-y;
	/* .ring is the focus ring: an outline on an SVG group follows its bounding box unreliably. */
	outline: none;
}
.chooser.dragging {
	cursor: grabbing;
}
.reach {
	fill: transparent;
}
.drop {
	stroke: var(--fui-accent-strong);
	stroke-width: 1;
}
.chosen {
	fill: var(--fui-accent-strong);
	stroke: var(--fui-surface-base);
	stroke-width: 2;
}
.chosen-classical {
	fill: var(--fui-surface-base);
	stroke: var(--fui-ink-muted);
	stroke-width: 1.5;
}
.ring {
	fill: none;
	stroke: var(--fui-accent);
	stroke-width: 2;
	opacity: 0;
}
.chooser:focus-visible .ring {
	opacity: 1;
}
.now {
	font-family: var(--fui-font-mono);
	font-variant-numeric: tabular-nums;
}
@media print {
	.controls,
	.ring {
		display: none;
	}
}
</style>
