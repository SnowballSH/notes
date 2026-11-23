<script lang="ts">
import { amplitudeAt, columnAt, plotPosition } from "./drawing.ts";
import { formatAmplitude, formatDyadic, minusSign } from "./format.ts";
import SignedBar from "./SignedBar.svelte";

interface Props {
	/** What the chart shows, for a reader who cannot see it. */
	name: string;
	labels: readonly string[];
	probabilities: readonly number[];
	/** Left out for something that has probabilities but no amplitudes, such as a coin. */
	amplitudes?: readonly number[];
	/** Writes each probability in its cell and labels the row of cells "Pr". */
	showProbabilityValues?: boolean;
	/** Makes the bars drawable: called with a column and the amplitude the pointer is at. */
	ondraw?: (index: number, amplitude: number) => void;
	ondrawend?: () => void;
	/** Called with a column and a key pressed on it; returns whether the key did something. */
	onkey?: (index: number, key: string) => boolean;
	/** Columns to pick out, such as the zero frequency: each is underlined and its label is bold. */
	highlighted?: readonly number[];
	/** Whether each column has the cell that darkens with its probability. */
	showProbabilityCells?: boolean;
	/** An amplitude to rule across the plots, such as the mean, with a short label. */
	level?: { value: number; label: string };
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
	highlighted,
	showProbabilityCells = true,
	level,
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

const labelled = $derived(showProbabilityCells && showProbabilityValues);

const isHighlighted = (index: number): boolean => highlighted?.includes(index) ?? false;

const describe = (index: number): string =>
	[
		isHighlighted(index) && "highlighted",
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
			<SignedBar {amplitude} />
		</span>
		{@const shown = formatAmplitude(amplitude)}
		<span class="amplitude" class:negative={shown.startsWith(minusSign)} aria-hidden="true">
			{shown}
		</span>
	{/if}
	{#if showProbabilityCells}
		<span
			class="chance"
			class:chance-value={showProbabilityValues}
			style:--chance={probabilities[index] ?? 0}
			aria-hidden="true">{showProbabilityValues ? formatDyadic(probabilities[index] ?? 0) : ""}</span
		>
	{/if}
	<span class="label" aria-hidden="true">{labels[index]}</span>
{/snippet}

<div
	class="chart"
	class:drawable={ondraw !== undefined}
	class:drawing={stroke !== undefined}
	class:crowded={labels.length > 4}
	class:labelled
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
				class:highlighted={isHighlighted(index)}
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
			<div class="column" class:highlighted={isHighlighted(index)} role="listitem">
				<span class="spoken">{label}: {describe(index)}</span>
				{@render column(index)}
			</div>
		{/if}
	{/each}
	{#if labelled}
		<span class="row-label" aria-hidden="true">Pr</span>
	{/if}
	{#if level && amplitudes}
		<span class="level" style:--down={plotPosition(level.value)} aria-hidden="true">
			<span class="level-label">{level.label}</span>
		</span>
	{/if}
</div>

<style>
.chart {
	position: relative;
	--unit: var(--chart-unit, 4.5rem);
	width: min(100%, var(--columns) * 3.25rem);
	display: grid;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
	font-family: var(--fui-font-mono);
	font-size: 0.6875rem;
	line-height: 1.5;
	color: var(--fui-ink);
}
/* The row label hangs in a gutter left of the columns, so it never shifts them off the bars. */
.labelled {
	--gutter: var(--chart-gutter, 1rem);
	width: min(100% - var(--gutter), var(--columns) * 3.25rem);
	margin-inline-start: var(--gutter);
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
.plot {
	position: relative;
	width: 100%;
	height: calc(2 * var(--unit));
	background: linear-gradient(var(--fui-ink-muted), var(--fui-ink-muted)) center / 100% 1px
		no-repeat;
}
.plot :global(.bar) {
	inset: 0 18% 50%;
}
.drawing :global(.bar) {
	transition: none;
}
.amplitude {
	color: var(--fui-accent-strong);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.crowded .amplitude {
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
	width: calc(100% - 4px);
	height: auto;
	min-height: 1.375rem;
	display: grid;
	place-items: center;
	border: 0;
	background: color-mix(in oklab, var(--fui-ink) calc(var(--chance) * 25%), transparent);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.crowded .chance-value {
	font-size: 0.625rem;
	letter-spacing: -0.03em;
}
/* Level with the cells: above the padding, the line of labels and the gap that lie under them. */
.row-label {
	position: absolute;
	inset: auto 100% calc(1.5em + 0.25rem) auto;
	height: 1.375rem;
	display: grid;
	place-items: center;
	padding-inline-end: 0.125rem;
	color: var(--fui-ink-secondary);
}
.label {
	color: var(--fui-ink-secondary);
}
.highlighted {
	box-shadow: inset 0 -2px 0 var(--fui-accent);
}
.highlighted .label {
	color: var(--fui-accent-strong);
	font-weight: 700;
}
.level {
	position: absolute;
	inset: calc(var(--down) * 2 * var(--unit)) 0 auto;
	border-top: 1px dashed var(--fui-ink-secondary);
	pointer-events: none;
	transition: top 250ms ease-out;
}
.level-label {
	position: absolute;
	right: 0;
	bottom: 1px;
	color: var(--fui-ink-secondary);
	line-height: 1;
	white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
	.chance,
	.level {
		transition: none;
	}
}
@media print {
	.chance {
		print-color-adjust: exact;
	}
}
</style>
