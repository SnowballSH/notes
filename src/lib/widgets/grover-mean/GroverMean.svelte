<script lang="ts">
import { untrack } from "svelte";
import { mean } from "../../quantum/grover.ts";
import SignedBar from "../../quantum/SignedBar.svelte";
import { bitstrings } from "../../quantum/state.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import {
	caption as captionText,
	defaultMarked,
	describeColumn,
	meanLabel,
	nextStep,
	plotScale,
	type Step,
	shownAmplitude,
	spokenSummary,
	stateAfter,
} from "./steps.ts";

const { qubits }: WidgetProps<typeof definition> = $props();
const groupName = $props.id();

let marked = $state(untrack(() => defaultMarked(qubits)));
let steps = $state(0);

const size = $derived(2 ** qubits);
const labels = $derived(bitstrings(qubits));
const current = $derived(stateAfter(qubits, marked, steps));
const next = $derived(nextStep(steps));
const scale = $derived(plotScale(current));

function take(step: Step): void {
	if (step === next) steps += 1;
}
</script>

<WidgetFrame>
	<div class="controls">
		<button
			type="button"
			class:due={next === "query"}
			aria-disabled={next !== "query"}
			onclick={() => take("query")}>Query</button
		>
		<button
			type="button"
			class:due={next === "diffuse"}
			aria-disabled={next !== "diffuse"}
			onclick={() => take("diffuse")}>Diffuse</button
		>
		<button type="button" aria-disabled={steps === 0} onclick={() => (steps = 0)}>
			Start over
		</button>
	</div>
	<div class="figure" class:crowded={size > 4} style:--columns={size}>
		<div
			class="chart"
			data-scale={scale}
			role="list"
			aria-label="Amplitudes of the {size} inputs, with the marked input highlighted"
		>
			{#each labels as label, index (label)}
				{@const amplitude = current[index] ?? 0}
				<div class="column" class:marked={marked === index} role="listitem">
					<span class="spoken">{describeColumn(label, amplitude, marked === index)}</span>
					<span class="plot" aria-hidden="true">
						<SignedBar amplitude={amplitude / scale} tone={marked === index ? "accent" : "neutral"} />
					</span>
					<span class="amplitude" class:negative={amplitude < 0} aria-hidden="true">
						{shownAmplitude(amplitude)}
					</span>
				</div>
			{/each}
			<span class="level" style:--level={mean(current) / scale} aria-hidden="true">
				<span class="level-label">{meanLabel(current)}</span>
			</span>
		</div>
		<div class="marking" role="radiogroup" aria-label="Marked input">
			{#each labels as label, index (label)}
				<label class:chosen={marked === index}>
					<input type="radio" name={groupName} value={index} bind:group={marked} />
					{label}
				</label>
			{/each}
		</div>
	</div>
	{#snippet caption()}
		<p class="spoken">{spokenSummary(qubits, marked, steps)}</p>
		<p class="shown" aria-hidden="true">{captionText(qubits, marked, steps)}</p>
	{/snippet}
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
button.due {
	border-color: var(--fui-accent);
	font-weight: 600;
}
label:has(:focus-visible) {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
.figure {
	--unit: 3.5rem;
	--gutter: 4.5rem;
	--number-size: 0.6875rem;
	width: min(100%, var(--columns) * 3.25rem + var(--gutter));
	display: grid;
	gap: 0.25rem;
	font-family: var(--fui-font-mono);
	font-size: var(--number-size);
	line-height: 1.5;
}
.figure.crowded {
	--number-size: 0.625rem;
}
.crowded .amplitude {
	letter-spacing: -0.03em;
}
.chart,
.marking {
	display: grid;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
	padding-right: var(--gutter);
}
.chart {
	position: relative;
}
.column {
	display: grid;
	justify-items: center;
	gap: 0.125rem;
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
.amplitude {
	color: var(--fui-accent-strong);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.amplitude.negative {
	color: var(--fui-code-warm);
}
.level {
	position: absolute;
	inset: calc((1 - var(--level)) * var(--unit)) var(--gutter) auto 0;
	border-top: 1px dashed var(--fui-ink-secondary);
	pointer-events: none;
	transition: top 250ms ease-out;
}
.level-label {
	position: absolute;
	inset: 0 auto auto 100%;
	transform: translateY(-50%);
	padding-inline-start: 0.375rem;
	font-size: 0.75rem;
	color: var(--fui-ink);
	white-space: nowrap;
}
label {
	position: relative;
	min-height: 2.75rem;
	margin: 0 0.0625rem;
	display: grid;
	place-items: center;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	font-size: 0.6875rem;
	color: var(--fui-ink-secondary);
}
label:hover {
	border-color: var(--fui-accent);
	background: var(--fui-surface-raised);
}
label.chosen {
	border: 2px solid var(--fui-accent);
	background: color-mix(in oklab, var(--fui-accent) 14%, transparent);
	color: var(--fui-accent-strong);
	font-weight: 700;
}
/* The invisible radio button covers its label, so that a click lands on it. */
input {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	margin: 0;
	opacity: 0;
	cursor: pointer;
}
.shown {
	margin: 0;
	font-family: var(--fui-font-mono);
}
@media (prefers-reduced-motion: reduce) {
	.level {
		transition: none;
	}
}
@media print {
	.controls {
		display: none;
	}
}
</style>
