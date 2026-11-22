<script lang="ts">
import { amplitudeAt, columnAt } from "./drawing.ts";
import { formatAmplitude, formatDyadic, minusSign } from "./format.ts";

interface Props {
	/** What the chart shows, for a reader who cannot see it. */
	name: string;
	labels: readonly string[];
	probabilities: readonly number[];
	/** Left out for something that has probabilities but no amplitudes, such as a coin. */
	amplitudes?: readonly number[];
	showProbabilityValues?: boolean;
	/** Makes the bars drawable: called with a column and the amplitude the pointer is at. */
	ondraw?: (index: number, amplitude: number) => void;
	ondrawend?: () => void;
	/** Called with a column and a key pressed on it; returns whether the key did something. */
	onkey?: (index: number, key: string) => boolean;
}

const {
	name,
	labels,
	probabilities,
	amplitudes,
	showProbabilityValues = false,
	ondraw,
	ondrawend,
	onkey,
}: Props = $props();

let chart = $state<HTMLElement>();
let stroke = $state<number>();

function drawAt(event: PointerEvent): void {
	const plots = chart?.querySelectorAll<HTMLElement>(".plot");
	const first = plots?.[0]?.getBoundingClientRect();
	const last = plots?.[plots.length - 1]?.getBoundingClientRect();
	if (!plots || !first || !last) return;
	const across = (event.clientX - first.left) / (last.right - first.left);
	const down = (event.clientY - first.top) / first.height;
	ondraw?.(columnAt(across, plots.length), amplitudeAt(down));
}

function startStroke(event: PointerEvent): void {
	if (!ondraw || !event.isPrimary || event.button !== 0) return;
	if (!(event.target instanceof Element) || !event.target.closest(".plot")) return;
	stroke = event.pointerId;
	chart?.setPointerCapture(event.pointerId);
	drawAt(event);
}

function continueStroke(event: PointerEvent): void {
	if (event.pointerId !== stroke) return;
	if (event.buttons === 0) endStroke(event);
	else drawAt(event);
}

function endStroke(event: PointerEvent): void {
	if (event.pointerId !== stroke) return;
	stroke = undefined;
	ondrawend?.();
}

function pressKey(event: KeyboardEvent, index: number): void {
	if (event.altKey || event.ctrlKey || event.metaKey) return;
	if (onkey?.(index, event.key)) event.preventDefault();
}

const describe = (index: number): string =>
	[
		amplitudes && `amplitude ${formatAmplitude(amplitudes[index] ?? 0)}`,
		`probability ${formatDyadic(probabilities[index] ?? 0)}`,
	]
		.filter(Boolean)
		.join(", ");
</script>

{#snippet column(index: number)}
	{@const amplitude = amplitudes?.[index]}
	{#if amplitude !== undefined}
		<span class="plot" aria-hidden="true">
			<span class="bar" class:negative={amplitude < 0} style:--size={Math.abs(amplitude)}></span>
		</span>
		{@const shown = formatAmplitude(amplitude)}
		<span class="amplitude" class:negative={shown.startsWith(minusSign)} aria-hidden="true">
			{shown}
		</span>
	{/if}
	<span class="chance" style:--chance={probabilities[index] ?? 0} aria-hidden="true"></span>
	{#if showProbabilityValues}
		<span class="chance-value" aria-hidden="true">{formatDyadic(probabilities[index] ?? 0)}</span>
	{/if}
	<span class="label" aria-hidden="true">{labels[index]}</span>
{/snippet}

<div
	class="chart"
	class:drawable={ondraw !== undefined}
	class:drawing={stroke !== undefined}
	class:dense={labels.length > 4}
	bind:this={chart}
	style:--columns={labels.length}
	role={ondraw ? "group" : "list"}
	aria-label={name}
	onpointerdown={startStroke}
	onpointermove={continueStroke}
	onpointerup={endStroke}
	onpointercancel={endStroke}
	onlostpointercapture={endStroke}
>
	{#each labels as label, index (label)}
		{#if ondraw}
			<div
				class="column"
				role="slider"
				tabindex="0"
				aria-orientation="vertical"
				aria-label="Amplitude of {label}"
				aria-valuemin={-1}
				aria-valuemax={1}
				aria-valuenow={Number((amplitudes?.[index] ?? 0).toFixed(3))}
				aria-valuetext={describe(index)}
				onkeydown={(event) => pressKey(event, index)}
			>
				{@render column(index)}
			</div>
		{:else}
			<div class="column" role="listitem">
				<span class="spoken">{label}: {describe(index)}</span>
				{@render column(index)}
			</div>
		{/if}
	{/each}
</div>

<style>
.chart {
	--unit: var(--chart-unit, 4.5rem);
	width: min(100%, var(--columns) * 3.25rem);
	display: grid;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
	font-family: var(--fui-font-mono);
	font-size: 0.6875rem;
	line-height: 1.5;
	color: var(--fui-ink);
}
.column {
	position: relative;
	display: grid;
	justify-items: center;
	align-content: start;
	gap: 0.125rem;
	padding-bottom: 0.125rem;
	border-radius: var(--fui-radius-xs);
}
.drawable {
	user-select: none;
}
.drawable .plot {
	cursor: ns-resize;
	touch-action: none;
}
.drawable .column:hover {
	background: var(--fui-surface-raised);
}
.column:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
.spoken {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
.plot {
	position: relative;
	width: 100%;
	height: calc(2 * var(--unit));
	background: linear-gradient(var(--fui-ink-muted), var(--fui-ink-muted)) center / 100% 1px
		no-repeat;
}
.bar {
	position: absolute;
	inset: auto 18% 50%;
	height: calc(var(--size) * 50%);
	border-radius: var(--fui-radius-xs) var(--fui-radius-xs) 0 0;
	background: var(--fui-accent);
	transition: height 250ms ease-out;
}
.bar.negative {
	inset: 50% 18% auto;
	border-radius: 0 0 var(--fui-radius-xs) var(--fui-radius-xs);
	background: var(--fui-code-warm);
}
.drawing .bar {
	transition: none;
}
.amplitude {
	color: var(--fui-accent-strong);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.dense .amplitude {
	font-size: 0.625rem;
	letter-spacing: -0.03em;
}
.amplitude.negative {
	color: var(--fui-code-warm);
}
.chance {
	width: 64%;
	height: 1.125rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-xs);
	background: color-mix(in oklab, var(--fui-ink) calc(var(--chance) * 100%), transparent);
	transition: background-color 250ms ease-out;
}
.chance-value {
	font-variant-numeric: tabular-nums;
}
.label {
	color: var(--fui-ink-secondary);
}
@media (prefers-reduced-motion: reduce) {
	.bar,
	.chance {
		transition: none;
	}
}
@media print {
	.bar,
	.chance {
		print-color-adjust: exact;
	}
}
</style>
