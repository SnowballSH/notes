<script lang="ts">
import { untrack } from "svelte";
import { formatSigned } from "../../quantum/format.ts";
import { clamp } from "../../quantum/numbers.ts";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import {
	allWires,
	butterflyColumns,
	butterflyInto,
	columnName,
	defaultInput,
	describeInput,
	describeLevel,
	equation,
	levels,
	movedNode,
	type Node,
	nodeId,
	nodeLabel,
	randomValues,
} from "./butterfly.ts";
import type definition from "./definition.ts";
import {
	columnCentre,
	headingAt,
	headingBaseline,
	heightFor,
	nodeHeight,
	nodeWidth,
	reachBox,
	rowCentre,
	width,
	wireSegment,
} from "./layout.ts";

const size = defaultInput.length;
const height = heightFor(size);
const wires = allWires(size);
const ringOffset = 2;

const { level: startLevel }: WidgetProps<typeof definition> = $props();

let input = $state.raw<readonly number[]>(defaultInput);
let level = $state(untrack(() => startLevel));
let picked = $state.raw<Node>();
let focused = $state.raw<Node>();
let cursor = $state.raw<Node>({ level: 0, index: 0 });
let diagram = $state<SVGSVGElement>();

const columns = $derived(butterflyColumns(input));
const traced = $derived(picked && picked.level <= level ? picked : undefined);
const sources = $derived(traced && traced.level > 0 ? butterflyInto(traced) : undefined);
/** The one entry that Tab reaches; the arrow keys move from it to the others. */
const tabStop = $derived(cursor.level <= level ? cursor : { level, index: cursor.index });

const same = (first: Node | undefined, second: Node): boolean =>
	first?.level === second.level && first.index === second.index;

const isSource = (node: Node): boolean =>
	sources !== undefined &&
	node.level + 1 === traced?.level &&
	(node.index === sources.upper || node.index === sources.lower);

function step(by: 1 | -1): void {
	level = clamp(level + by, 0, levels);
}

function focusNode(node: Node): void {
	cursor = node;
	focused = node;
	picked = node;
}

function blurNode(node: Node): void {
	focused = undefined;
	if (same(picked, node)) picked = undefined;
}

function pressKey(event: KeyboardEvent, node: Node): void {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		focusNode(node);
		return;
	}
	const next = movedNode(node, event.key, level, size);
	if (!next) return;
	event.preventDefault();
	diagram?.querySelector<SVGGElement>(`[data-node="${nodeId(next)}"]`)?.focus();
}
</script>

<WidgetFrame>
	<div class="controls">
		<button
			type="button"
			class="primary"
			aria-label="Next level"
			aria-disabled={level === levels}
			onclick={() => step(1)}>Next</button
		>
		<button type="button" aria-disabled={level === 0} onclick={() => step(-1)}>Back</button>
		<button
			type="button"
			aria-label="Random values"
			onclick={() => (input = randomValues(Math.random, size))}>Random</button
		>
	</div>
	<svg
		bind:this={diagram}
		class="diagram"
		viewBox="0 0 {width} {height}"
		role="group"
		aria-label="Butterfly diagram of the fast Walsh-Hadamard transform of {size} values"
	>
		<g aria-hidden="true">
			{#each columns as _, column (column)}
				{@const heading = headingAt(column, levels)}
				<text
					class="heading"
					class:pending={column > level}
					x={heading.x}
					y={headingBaseline}
					text-anchor={heading.anchor}>{columnName(column)}</text
				>
			{/each}
			{#each wires as wire (`${wire.level}-${wire.from}-${wire.to}`)}
				{@const segment = wireSegment(wire.level, wire.from, wire.to, levels)}
				<line
					class="wire"
					class:minus={wire.sign === -1}
					class:pending={wire.level > level}
					class:lit={traced?.level === wire.level && traced.index === wire.to}
					class:dimmed={sources !== undefined}
					{...segment}
				/>
			{/each}
		</g>
		{#each columns as values, column (column)}
			{#each values as value, index (index)}
				{@const node = { level: column, index }}
				{@const x = columnCentre(column, levels)}
				{@const y = rowCentre(index)}
				{#if column <= level}
					<g
						class="node"
						class:positive={value > 0}
						class:negative={value < 0}
						class:traced={same(traced, node)}
						class:source={isSource(node)}
						role="button"
						tabindex={same(tabStop, node) ? 0 : -1}
						aria-label={nodeLabel(node, value)}
						data-node={nodeId(node)}
						onfocus={() => focusNode(node)}
						onblur={() => blurNode(node)}
						onpointerenter={() => (picked = node)}
						onpointerleave={() => (picked = focused)}
						onclick={() => focusNode(node)}
						onkeydown={(event) => pressKey(event, node)}
					>
						<rect class="reach" {...reachBox(column, index, levels)} />
						<rect
							class="ring"
							x={x - nodeWidth / 2 - ringOffset}
							y={y - nodeHeight / 2 - ringOffset}
							width={nodeWidth + 2 * ringOffset}
							height={nodeHeight + 2 * ringOffset}
							rx="6"
						/>
						<rect
							class="box"
							x={x - nodeWidth / 2}
							y={y - nodeHeight / 2}
							width={nodeWidth}
							height={nodeHeight}
							rx="4"
						/>
						<text class="value" {x} {y}>{formatSigned(value)}</text>
					</g>
				{:else}
					<rect
						class="box pending"
						aria-hidden="true"
						x={x - nodeWidth / 2}
						y={y - nodeHeight / 2}
						width={nodeWidth}
						height={nodeHeight}
						rx="4"
					/>
				{/if}
			{/each}
		{/each}
	</svg>
	<p class="legend">
		<span>
			<svg class="swatch" viewBox="0 0 24 8" aria-hidden="true">
				<line class="wire" x1="0" y1="4" x2="24" y2="4" />
			</svg>
			+
		</span>
		<span>
			<svg class="swatch" viewBox="0 0 24 8" aria-hidden="true">
				<line class="wire minus" x1="0" y1="4" x2="24" y2="4" />
			</svg>
			&minus;
		</span>
	</p>
	{#snippet caption()}
		<p class="spoken"><span>{describeLevel(level)}</span> <span>{describeInput(input)}</span></p>
		<p class="now">{traced ? equation(columns, traced) : ""}</p>
	{/snippet}
</WidgetFrame>

<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
}
button {
	padding: 0 0.625rem;
	font-size: 0.9375rem;
}
button.primary {
	border-color: var(--fui-accent);
	font-weight: 600;
}
p {
	margin: 0;
}
.diagram {
	display: block;
	width: 100%;
	max-width: 24rem;
	height: auto;
}
.heading {
	font-family: var(--fui-font-sans);
	font-size: 10px;
	fill: var(--fui-ink-secondary);
}
.heading.pending {
	fill: var(--fui-ink-muted);
	opacity: 0.6;
}
.wire {
	stroke: var(--fui-ink);
	stroke-width: 1.25;
	stroke-linecap: round;
	opacity: 0.75;
	pointer-events: none;
	transition:
		opacity 150ms ease,
		stroke-width 150ms ease;
}
.wire.minus {
	stroke: var(--fui-accent);
	stroke-dasharray: 4 3;
	opacity: 1;
}
.wire.dimmed {
	opacity: 0.15;
}
.wire.pending {
	opacity: 0.15;
}
.wire.lit {
	stroke-width: 2.5;
	opacity: 1;
}
.box {
	fill: var(--fui-surface-raised);
	stroke: var(--fui-line);
	stroke-width: 1;
	transition: fill 150ms ease;
}
.box.pending {
	fill: none;
	stroke-dasharray: 2 3;
}
.positive .box {
	fill: color-mix(in oklab, var(--fui-code-green) 22%, var(--fui-surface-base));
	stroke: color-mix(in oklab, var(--fui-code-green) 60%, var(--fui-surface-base));
}
.negative .box {
	fill: color-mix(in oklab, var(--fui-code-warm) 22%, var(--fui-surface-base));
	stroke: color-mix(in oklab, var(--fui-code-warm) 60%, var(--fui-surface-base));
}
.source .box,
.traced .box {
	stroke: var(--fui-ink);
	stroke-width: 2;
}
.value {
	font-family: var(--fui-font-mono);
	font-size: 12px;
	font-weight: 600;
	fill: var(--fui-ink);
	text-anchor: middle;
	dominant-baseline: central;
	pointer-events: none;
}
.node {
	cursor: default;
	outline: none;
}
.reach {
	fill: transparent;
}
.ring {
	fill: none;
	stroke: var(--fui-accent);
	stroke-width: 2;
	opacity: 0;
}
.node:focus-visible .ring {
	opacity: 1;
}
.legend {
	display: flex;
	flex-wrap: wrap;
	gap: 0 1rem;
	font-size: 0.875rem;
	line-height: 1.5;
	color: var(--fui-ink-secondary);
}
.legend > span {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
}
.swatch {
	width: 1.5rem;
	height: 0.5rem;
}
.swatch .wire {
	stroke-width: 1.5;
}
.now {
	min-height: 1.5em;
	font-variant-numeric: tabular-nums;
}
@media (prefers-reduced-motion: reduce) {
	.wire,
	.box {
		transition: none;
	}
}
@media print {
	.controls,
	.ring {
		display: none;
	}
}
</style>
