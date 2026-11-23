<script lang="ts">
import { formatSigned } from "../../quantum/format.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import {
	canStep,
	defaults,
	inputLabel,
	inputs,
	resultName,
	stepped,
	sumExpression,
	type Values,
	xorConvolution,
} from "./convolution.ts";

let f = $state.raw<Values>(defaults.f);
let g = $state.raw<Values>(defaults.g);
let selected = $state(0b01);

const convolution = $derived(xorConvolution(f, g));
</script>

{#snippet stepper(name: string, value: number, change: number, step: () => void)}
	<button
		type="button"
		class="step"
		aria-label="{change > 0 ? 'Increase' : 'Decrease'} {name}"
		aria-disabled={!canStep(value, change)}
		onclick={step}
	>
		<svg viewBox="0 0 12 12" aria-hidden="true">
			<path d={change > 0 ? "M2 6h8M6 2v8" : "M2 6h8"} />
		</svg>
	</button>
{/snippet}

{#snippet entry(name: string, value: number)}
	<span class="entry">
		<span class="name">{name}</span>
		<span class="value">{formatSigned(value)}</span>
	</span>
{/snippet}

<WidgetFrame>
	<div class="grid" role="table" aria-label="Products f(x)·g(y), tinted by z = x ⊕ y">
		<div class="row" role="row">
			<div class="corner" role="cell">⊕</div>
			{#each g as value, y (y)}
				{@const name = `g(${inputLabel(y)})`}
				<div class="header across" role="columnheader" aria-label="{name} = {formatSigned(value)}">
					{@render stepper(name, value, 1, () => (g = stepped(g, y, 1)))}
					{@render entry(name, value)}
					{@render stepper(name, value, -1, () => (g = stepped(g, y, -1)))}
				</div>
			{/each}
		</div>
		{#each f as value, x (x)}
			{@const name = `f(${inputLabel(x)})`}
			<div class="row" role="row">
				<div class="header down" role="rowheader" aria-label="{name} = {formatSigned(value)}">
					{@render stepper(name, value, -1, () => (f = stepped(f, x, -1)))}
					{@render entry(name, value)}
					{@render stepper(name, value, 1, () => (f = stepped(f, x, 1)))}
				</div>
				{#each g as other, y (y)}
					{@const z = x ^ y}
					{@const product = formatSigned(value * other)}
					<div
						class="cell"
						role="cell"
						data-z={z}
						aria-current={z === selected ? "true" : undefined}
						aria-label="f({inputLabel(x)})·g({inputLabel(y)}) = {product}, z = {inputLabel(z)}"
					>
						<span class="product">{product}</span>
						<span class="z">{inputLabel(z)}</span>
					</div>
				{/each}
			</div>
		{/each}
	</div>
	<div class="results" role="group" aria-label="Values of f ∗ g">
		{#each inputs as z (z)}
			{@const result = formatSigned(convolution[z] ?? 0)}
			<button
				type="button"
				class="chip"
				data-z={z}
				aria-pressed={z === selected}
				onclick={() => (selected = z)}
			>
				<span class="z">{resultName(z)}<span class="spoken"> = </span></span><span class="result"
					>{result}</span
				>
			</button>
		{/each}
	</div>
	{#snippet caption()}
		<p class="sum">
			<span class="result-name">{resultName(selected)} ={" "}</span>{sumExpression(f, g, selected)}
		</p>
	{/snippet}
</WidgetFrame>

<style>
.grid,
.results {
	--header: 7.75rem;
	--gap: 0.25rem;
	width: min(100%, 24rem);
	font-family: var(--fui-font-mono);
	font-variant-numeric: tabular-nums;
	line-height: 1.2;
}
.grid {
	display: grid;
	gap: var(--gap);
}
.row {
	display: grid;
	grid-template-columns: var(--header) repeat(4, minmax(0, 1fr));
	gap: var(--gap);
}
[data-z="0"] {
	--tone: var(--fui-code-blue);
}
[data-z="1"] {
	--tone: var(--fui-code-green);
}
[data-z="2"] {
	--tone: var(--fui-code-warm);
}
[data-z="3"] {
	--tone: var(--fui-code-violet);
}
.header {
	display: grid;
	align-items: stretch;
	border-radius: var(--fui-radius-sm);
	background: var(--fui-surface-raised);
	box-shadow: inset 0 0 0 1px var(--fui-line);
}
.header.across {
	grid-template-rows: 2.75rem 2.25rem 2.75rem;
}
.header.down {
	grid-template-columns: 2.75rem minmax(0, 1fr) 2.75rem;
	min-height: 2.75rem;
}
.entry {
	display: grid;
	place-content: center;
	justify-items: center;
	gap: 0.0625rem;
}
.corner {
	display: grid;
	place-content: center;
	font-size: 1rem;
	color: var(--fui-ink-secondary);
}
.name {
	font-size: 0.75rem;
	color: var(--fui-ink-secondary);
	white-space: nowrap;
}
.value {
	font-size: 1rem;
	font-weight: 700;
	color: var(--fui-ink);
}
/* Steppers and chips have their own look and hover styles. */
button {
	min-height: auto;
	border: 0;
	border-radius: 0;
	background: transparent;
}
.step {
	display: grid;
	place-items: center;
	padding: 0;
	border-radius: var(--fui-radius-xs);
	color: var(--fui-accent-strong);
}
.step svg {
	width: 0.75rem;
	height: 0.75rem;
	fill: none;
	stroke: currentColor;
	stroke-width: 1.75;
	stroke-linecap: round;
}
.step:not([aria-disabled="true"]):hover {
	background: color-mix(in oklab, var(--fui-accent) 18%, transparent);
}
.step[aria-disabled="true"] {
	color: var(--fui-ink-muted);
	opacity: 0.45;
	cursor: not-allowed;
}
.cell {
	display: grid;
	place-content: center;
	justify-items: center;
	gap: 0.0625rem;
	min-height: 2.75rem;
	border: 1px solid color-mix(in oklab, var(--tone) 35%, transparent);
	border-radius: var(--fui-radius-sm);
	background: color-mix(in oklab, var(--tone) 14%, transparent);
	transition: box-shadow 200ms ease-out;
}
.cell[aria-current="true"] {
	border-color: var(--tone);
	box-shadow: 0 0 0 2px var(--tone);
}
.product,
.result {
	font-size: 1rem;
	font-weight: 700;
	color: var(--fui-ink);
}
.z {
	font-size: 0.75rem;
	color: color-mix(in oklab, var(--tone) 65%, var(--fui-ink));
	white-space: nowrap;
}
.results {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 0.5rem;
	margin-top: 0.5rem;
}
.chip {
	display: grid;
	place-content: center;
	justify-items: center;
	gap: 0.0625rem;
	min-height: 2.75rem;
	padding: 0.25rem 0;
	border: 1px solid color-mix(in oklab, var(--tone) 55%, var(--fui-line));
	border-radius: var(--fui-radius-md);
	background: color-mix(in oklab, var(--tone) 14%, transparent);
	transition:
		background-color 200ms ease-out,
		box-shadow 200ms ease-out;
}
.chip:hover {
	background: color-mix(in oklab, var(--tone) 26%, transparent);
}
.chip[aria-pressed="true"] {
	border-color: var(--tone);
	box-shadow: 0 0 0 2px var(--tone);
}
.chip .z {
	font-size: clamp(0.625rem, 3.3vw, 0.75rem);
	/* The name keeps its spaces for screen readers; a mono space is 1ch, so this draws it as (f∗g)(00). */
	word-spacing: -1ch;
}
.chip .result {
	font-size: 1.125rem;
}
.sum {
	margin: 0;
	min-height: 3lh;
	font-family: var(--fui-font-mono);
	color: var(--fui-ink);
}
@media (min-width: 30rem) {
	.sum {
		min-height: 2lh;
	}
}
@media (prefers-reduced-motion: reduce) {
	.cell,
	.chip {
		transition: none;
	}
}
@media print {
	.step {
		visibility: hidden;
	}
	.sum {
		min-height: 0;
	}
	.cell,
	.chip {
		print-color-adjust: exact;
	}
}
@media (max-width: 29.99rem) {
	.result-name {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
}
</style>
