<script lang="ts">
import AmplitudeChart from "../../quantum/AmplitudeChart.svelte";
import { formatAmplitude, ket } from "../../quantum/format.ts";
import { probabilities } from "../../quantum/state.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import {
	applyHadamard,
	cancels,
	describeStep,
	type Experiment,
	formatTerms,
	measure,
	result,
	start,
	stateName,
	summarise,
} from "./experiment.ts";

const shownSteps = 6;
const bits = ["0", "1"] as const;
const kets = bits.map(ket);

let experiment = $state.raw<Experiment>(start);

const history = $derived([
	ket("0"),
	...(experiment.steps.length > shownSteps ? ["…"] : []),
	...experiment.steps.slice(-shownSteps).map(describeStep),
]);
const interfering = $derived(
	(experiment.terms ?? []).some((terms) => terms.every((term) => term !== 0)),
);
</script>

<WidgetFrame>
	<div class="controls">
		<button type="button" onclick={() => (experiment = applyHadamard(experiment))}>Apply H</button>
		<button type="button" onclick={() => (experiment = measure(experiment, Math.random))}>
			Measure
		</button>
		<button
			type="button"
			aria-disabled={experiment.steps.length === 0}
			onclick={() => (experiment = start)}
		>
			Start over
		</button>
	</div>
	<p class="history"><span class="spoken">Steps so far: </span>{history.join(" \u2192 ")}</p>
	<div class="sides">
		<div class="side" role="group" aria-label="Qubit">
			<p class="name">Qubit {stateName(experiment.qubit)}</p>
			<AmplitudeChart
				name="Amplitudes and probabilities of the qubit"
				labels={kets}
				amplitudes={experiment.qubit}
				probabilities={probabilities(experiment.qubit)}
				showProbabilityValues
			/>
		</div>
		<div class="side" role="group" aria-label="Classical coin">
			<p class="name">Coin</p>
			<AmplitudeChart
				name="Probabilities of the coin"
				labels={[...bits]}
				probabilities={experiment.coin}
				showProbabilityValues
			/>
		</div>
	</div>
	<p class="terms">
		{#if interfering}
			{#each experiment.terms ?? [] as terms, bit (bit)}
				<span class:cancelled={cancels(terms)}>
					{kets[bit]}: {formatTerms(terms)} = {formatAmplitude(experiment.qubit[bit] ?? 0)}
				</span>
			{/each}
		{/if}
	</p>
	{#snippet caption()}
		<p class="spoken">{summarise(experiment)}</p>
		<p class="result" aria-hidden="true">{result(experiment)}</p>
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
.history,
.terms {
	font-family: var(--fui-font-mono);
	font-size: 0.875rem;
	line-height: 1.5;
}
.history {
	color: var(--fui-ink);
	overflow-wrap: anywhere;
}
.sides {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 13rem));
	gap: 0.75rem;
	width: 100%;
}
.side {
	display: grid;
	--chart-unit: 2.5rem;
	grid-template-rows: auto 1fr;
	gap: 0.5rem;
	justify-items: center;
	padding: 0.75rem 0.5rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-md);
}
.side > :global(.chart) {
	align-self: end;
}
.name {
	justify-self: start;
	padding-left: 0.375rem;
	font-weight: 600;
	color: var(--fui-ink);
}
.result {
	min-height: 1.5em;
}
.terms {
	display: flex;
	flex-wrap: wrap;
	gap: 0 1.5rem;
	min-height: 3em;
	align-content: start;
	color: var(--fui-ink-secondary);
}
.terms > span {
	white-space: nowrap;
}
.spoken {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
.cancelled {
	color: var(--fui-ink);
	font-weight: 700;
}
@media print {
	button {
		display: none;
	}
}
</style>
