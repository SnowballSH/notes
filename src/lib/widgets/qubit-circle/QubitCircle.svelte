<script lang="ts">
import { cubicInOut } from "svelte/easing";
import { prefersReducedMotion, Tween } from "svelte/motion";
import AmplitudeChart from "../../quantum/AmplitudeChart.svelte";
import { ket } from "../../quantum/format.ts";
import { type Amplitudes, probabilities } from "../../quantum/state.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import {
	angleOf,
	degreesPerStep,
	describeState,
	keyedStep,
	mirrorAngle,
	namedStates,
	nearestStep,
	reflectStep,
	stateAt,
	stepsPerTurn,
} from "./circle.ts";
import { anchorAt, centre, pointAtAngle, pointOf, radius, size } from "./layout.ts";

const reflectionTime = 600;
const labelDistance = radius + 14;
const shortestLabelledLeg = 0.2;
const outcomes = [ket("0"), ket("1")];
const symbols = ["α", "β"];
const mirror = {
	from: pointAtAngle(mirrorAngle + Math.PI, radius + 16),
	to: pointAtAngle(mirrorAngle, radius + 20),
	label: pointAtAngle(mirrorAngle, radius + 28),
};

let step = $state(0);
let dragging = $state(false);
let picture = $state<SVGSVGElement>();
/** The arrow as drawn: it slides along the chord to its mirror image when H is applied. */
const shown = new Tween<Amplitudes>(stateAt(0), { easing: cubicInOut });

const current = $derived(stateAt(step));
const image = $derived(stateAt(reflectStep(step)));
const onMirror = $derived(reflectStep(step) === step);
const tip = $derived(pointOf(shown.current));
const alpha = $derived(shown.current[0] ?? 0);
const beta = $derived(shown.current[1] ?? 0);

function moveTo(next: number, duration = 0): void {
	if (next === step) return;
	step = next;
	shown.set(stateAt(next), { duration });
}

function applyHadamard(): void {
	moveTo(reflectStep(step), prefersReducedMotion.current ? 0 : reflectionTime);
}

function dragTo(event: PointerEvent): void {
	const box = picture?.getBoundingClientRect();
	if (!box) return;
	const across = event.clientX - (box.left + box.width / 2);
	const up = box.top + box.height / 2 - event.clientY;
	if (Math.hypot(across, up) > 0) moveTo(nearestStep(across, up));
}

function startDrag(event: PointerEvent & { currentTarget: SVGGElement }): void {
	if (!event.isPrimary || event.button !== 0) return;
	dragging = true;
	event.currentTarget.setPointerCapture(event.pointerId);
}

function pressKey(event: KeyboardEvent): void {
	if (event.altKey || event.ctrlKey || event.metaKey) return;
	const next = keyedStep(step, event.key);
	if (next === undefined) return;
	event.preventDefault();
	moveTo(next);
}
</script>

<WidgetFrame>
	<div class="controls">
		<div class="row" role="group" aria-label="Named states">
			{#each namedStates as named (named.name)}
				<button
					type="button"
					class="state"
					aria-pressed={named.step === step}
					onclick={() => moveTo(named.step)}>{named.name}</button
				>
			{/each}
		</div>
		<button type="button" class="apply" onclick={applyHadamard}>Apply H</button>
	</div>
	<div class="view">
		<svg
			bind:this={picture}
			class="circle"
			viewBox="0 0 {size} {size}"
			role="group"
			aria-label="Qubit state on the unit circle"
		>
			<g
				role="img"
				aria-label="Unit circle with {ket('0')} along the horizontal axis, {ket(
					'1',
				)} along the vertical axis, and the mirror line of H dashed at the angle π/8"
			>
				<line class="axis" x1={centre - radius - 8} y1={centre} x2={centre + radius + 8} y2={centre} />
				<line class="axis" x1={centre} y1={centre - radius - 8} x2={centre} y2={centre + radius + 8} />
				<circle class="unit" cx={centre} cy={centre} r={radius} />
				<line class="mirror" x1={mirror.from.x} y1={mirror.from.y} x2={mirror.to.x} y2={mirror.to.y} />
				<text class="mirror-label" x={mirror.label.x} y={mirror.label.y}>H</text>
				{#each namedStates as named (named.name)}
					{@const angle = angleOf(named.step)}
					{@const dot = pointAtAngle(angle, radius)}
					{@const label = pointAtAngle(angle, labelDistance)}
					<circle class="named" cx={dot.x} cy={dot.y} r="3" />
					<text class="named-label" x={label.x} y={label.y} text-anchor={anchorAt(angle)}>
						{named.name}
					</text>
				{/each}
			</g>
			<g aria-hidden="true">
				{#if !onMirror}
					{@const from = pointOf(current)}
					{@const to = pointOf(image)}
					<line class="chord" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
					<circle class="image" cx={to.x} cy={to.y} r="5" />
				{/if}
				<line class="leg" class:negative={alpha < 0} x1={centre} y1={centre} x2={tip.x} y2={centre} />
				<line class="leg" class:negative={beta < 0} x1={tip.x} y1={centre} x2={tip.x} y2={tip.y} />
				{#if Math.abs(alpha) >= shortestLabelledLeg}
					<text
						class="leg-label"
						class:negative={alpha < 0}
						x={(centre + tip.x) / 2}
						y={centre + (beta < 0 ? -10 : 11)}>α</text
					>
				{/if}
				{#if Math.abs(beta) >= shortestLabelledLeg}
					<text
						class="leg-label"
						class:negative={beta < 0}
						x={tip.x + (alpha < 0 ? -10 : 10)}
						y={(centre + tip.y) / 2}>β</text
					>
				{/if}
				<line class="arrow" x1={centre} y1={centre} x2={tip.x} y2={tip.y} />
			</g>
			<g
				class="handle"
				class:dragging
				role="slider"
				tabindex="0"
				aria-label="Angle of the state"
				aria-valuemin={0}
				aria-valuemax={(stepsPerTurn - 1) * degreesPerStep}
				aria-valuenow={step * degreesPerStep}
				aria-valuetext={describeState(current)}
				onpointerdown={startDrag}
				onpointermove={(event) => dragging && dragTo(event)}
				onpointerup={() => (dragging = false)}
				onpointercancel={() => (dragging = false)}
				onlostpointercapture={() => (dragging = false)}
				onkeydown={pressKey}
			>
				<circle class="reach" cx={tip.x} cy={tip.y} r="22" />
				<circle class="ring" cx={tip.x} cy={tip.y} r="13" />
				<circle class="knob" cx={tip.x} cy={tip.y} r="9" />
			</g>
		</svg>
		<div class="bars">
			<div class="symbols" aria-hidden="true">
				{#each symbols as symbol, index (symbol)}
					<span class:negative={(current[index] ?? 0) < 0}>{symbol}</span>
				{/each}
			</div>
			<AmplitudeChart
				name="Amplitudes and measurement probabilities"
				labels={outcomes}
				amplitudes={current}
				probabilities={probabilities(current)}
				showProbabilityValues
			/>
		</div>
	</div>
	{#snippet caption()}
		<p class="spoken">{describeState(current)}</p>
	{/snippet}
</WidgetFrame>

<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem 1rem;
}
.row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
}
button {
	min-width: 2.75rem;
	min-height: 2.75rem;
	padding: 0 0.625rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	font-size: 0.9375rem;
	cursor: pointer;
}
button.state {
	font-family: var(--fui-font-mono);
}
button.state[aria-pressed="true"] {
	border-color: var(--fui-ink);
	background: var(--fui-surface-raised);
	font-weight: 700;
}
button.apply {
	border-color: var(--fui-code-violet);
	font-weight: 600;
}
button:hover {
	border-color: var(--fui-accent);
	background: var(--fui-surface-raised);
}
/* A hover that outlasts the click must not look like a pressed preset, so H thickens its outline instead of filling. */
button.apply:hover {
	border-color: var(--fui-code-violet);
	background: transparent;
	box-shadow: inset 0 0 0 1px var(--fui-code-violet);
}
button:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
p {
	margin: 0;
}
.view {
	container-type: inline-size;
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem 1.5rem;
}
.circle {
	display: block;
	flex: 0 1 18rem;
	min-width: 0;
	max-width: 100%;
	height: auto;
	aspect-ratio: 1;
	user-select: none;
}
.bars {
	flex: 0 0 6.5rem;
	display: grid;
	justify-items: center;
}
.symbols {
	width: min(100%, 6.5rem);
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	justify-items: center;
	color: var(--fui-accent-strong);
	font-family: var(--fui-font-mono);
	font-size: 0.75rem;
	font-weight: 700;
	line-height: 1.5;
}
.symbols .negative {
	color: var(--fui-code-warm);
}
.bars :global(.chance) {
	display: none;
}
.bars :global(.chance-value) {
	min-width: 64%;
	margin-block: 0.125rem;
	padding: 0 0.25rem;
	border: 1px solid var(--fui-ink-muted);
	border-radius: var(--fui-radius-xs);
	text-align: center;
}
/* Narrower than the circle, the gap and the bars together, the bars wrap under the circle. */
@container (width < 26rem) {
	.circle {
		margin-inline: auto;
	}
	.bars {
		flex-basis: 100%;
		margin-top: -1.5rem;
		--chart-unit: 3.5rem;
	}
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
.mirror {
	stroke: var(--fui-code-violet);
	stroke-width: 1.5;
	stroke-dasharray: 6 4;
}
.mirror-label {
	fill: var(--fui-code-violet);
	font-family: var(--fui-font-sans);
	font-size: 13px;
	font-weight: 700;
	text-anchor: middle;
	dominant-baseline: central;
}
.named {
	fill: var(--fui-ink-secondary);
}
.named-label {
	fill: var(--fui-ink-secondary);
	font-family: var(--fui-font-mono);
	font-size: 12px;
	dominant-baseline: central;
}
.chord {
	stroke: var(--fui-code-violet);
	stroke-width: 1;
	stroke-dasharray: 1 4;
	stroke-linecap: round;
}
.image {
	fill: var(--fui-surface-base);
	stroke: var(--fui-code-violet);
	stroke-width: 1.5;
}
.leg {
	stroke: var(--fui-accent);
	stroke-width: 4;
	stroke-linecap: round;
	opacity: 0.85;
}
.leg.negative {
	stroke: var(--fui-code-warm);
}
.leg-label {
	fill: var(--fui-accent-strong);
	font-family: var(--fui-font-mono);
	font-size: 12px;
	font-weight: 700;
	text-anchor: middle;
	dominant-baseline: central;
	/* A halo in the page colour, so the mirror line and the chord break around the letter near |+⟩. */
	paint-order: stroke;
	stroke: var(--fui-surface-base);
	stroke-width: 4;
	stroke-linejoin: round;
}
.leg-label.negative {
	fill: var(--fui-code-warm);
}
.arrow {
	stroke: var(--fui-ink);
	stroke-width: 2;
	stroke-linecap: round;
}
.handle {
	cursor: grab;
	touch-action: none;
	/* The .ring circle is the focus ring: an outline on an SVG group follows its bounding box unreliably. */
	outline: none;
}
.handle.dragging {
	cursor: grabbing;
}
.reach {
	fill: transparent;
}
.knob {
	fill: var(--fui-ink);
	stroke: var(--fui-surface-base);
	stroke-width: 2;
}
.handle:hover .knob,
.handle.dragging .knob {
	fill: var(--fui-accent);
}
.ring {
	fill: none;
	stroke: var(--fui-accent);
	stroke-width: 2;
	opacity: 0;
}
.handle:focus-visible .ring {
	opacity: 1;
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
	.controls,
	.ring {
		display: none;
	}
	.leg {
		print-color-adjust: exact;
	}
}
</style>
