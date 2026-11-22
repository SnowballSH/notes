<script lang="ts">
import { untrack } from "svelte";
import AmplitudeChart from "../../quantum/AmplitudeChart.svelte";
import { mean } from "../../quantum/grover.ts";
import { bitstring, probabilities } from "../../quantum/state.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import {
	caption as captionText,
	defaultMarked,
	describe,
	nextStep,
	type Step,
	stateAfter,
} from "./steps.ts";

const { qubits }: WidgetProps<typeof definition> = $props();
const groupName = $props.id();

let marked = $state(untrack(() => defaultMarked(qubits)));
let steps = $state(0);

const size = $derived(2 ** qubits);
const labels = $derived(Array.from({ length: size }, (_, index) => bitstring(index, qubits)));
const current = $derived(stateAfter(qubits, marked, steps));
const next = $derived(nextStep(steps));

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
	<AmplitudeChart
		name="Amplitudes of the {size} inputs, with the marked input highlighted"
		{labels}
		amplitudes={current}
		probabilities={probabilities(current)}
		highlighted={[marked]}
		level={{ value: mean(current), label: "μ" }}
	/>
	<div class="marking" role="radiogroup" aria-label="Marked input" style:--columns={size}>
		{#each labels as label, index (label)}
			<label class:chosen={marked === index}>
				<input type="radio" name={groupName} value={index} bind:group={marked} />
				{label}
			</label>
		{/each}
	</div>
	{#snippet caption()}
		<p class="spoken">{describe(qubits, marked, steps)}</p>
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
	min-height: 2.75rem;
	padding: 0 1rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	cursor: pointer;
}
button.due {
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
label:has(:focus-visible) {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
.marking {
	width: min(100%, var(--columns) * 3.25rem);
	display: grid;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
}
label {
	position: relative;
	min-height: 2.75rem;
	margin: 0 0.0625rem;
	display: grid;
	place-items: center;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	font-family: var(--fui-font-mono);
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
/* The radio button itself is invisible but covers its label, so that it is what a click lands on. */
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
.spoken {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: 0;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
@media print {
	.controls,
	.marking {
		display: none;
	}
}
</style>
