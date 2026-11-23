<script lang="ts">
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import { describeCircuit, diffusionDescription } from "./circuit.ts";
import type definition from "./definition.ts";
import {
	baseBaseline,
	baseFontSize,
	circuitDiagram,
	type Diagram,
	diffusionDiagram,
	ellipsisDotRadius,
	ellipsisPitch,
	ellipsisRow,
	labelAnchors,
	leadFontSize,
	scriptFontSize,
	subBaseline,
	supBaseline,
	width,
	wireRows,
} from "./layout.ts";

const { kind }: WidgetProps<typeof definition> = $props();

let diffusionShown = $state(false);

const circuit = $derived(circuitDiagram(kind));
const ellipsisRows = [-1, 0, 1].map((step) => ellipsisRow + step * ellipsisPitch);
const diffusionId = $props.id();
</script>

{#snippet picture(diagram: Diagram, description: string, id?: string)}
	<svg {id} class="circuit" viewBox="0 0 {width} {diagram.height}" role="img" aria-label={description}>
		{#each diagram.leads as lead (lead.y)}
			<text class="lead" font-size={leadFontSize} x={diagram.leadX} y={lead.y}>{lead.text}</text>
		{/each}
		{#each wireRows as row (row)}
			<line class="wire" x1={diagram.wire.x1} y1={row} x2={diagram.wire.x2} y2={row} />
		{/each}
		{#each diagram.ellipsisColumns as column (column)}
			{#each ellipsisRows as row (row)}
				<circle class="dot" cx={column} cy={row} r={ellipsisDotRadius} />
			{/each}
		{/each}
		{#each diagram.gates as gate (gate.x)}
			{@const anchors = labelAnchors(gate)}
			<g class="gate" class:query={gate.query}>
				<rect class="box" x={gate.x} y={gate.y} width={gate.width} height={gate.height} rx="6" />
				<text class="name" font-size={baseFontSize}><tspan x={anchors.base} y={baseBaseline}>{gate.label.base}</tspan>{#if gate.label.sup}<tspan class="script" font-size={scriptFontSize} x={anchors.script} y={supBaseline}>{gate.label.sup}</tspan>{/if}{#if gate.label.sub}<tspan class="script" font-size={scriptFontSize} x={anchors.script} y={subBaseline}>{gate.label.sub}</tspan>{/if}</text>
			</g>
		{/each}
		{#each diagram.meters as meter (meter.y)}
			{@const centre = meter.x + meter.width / 2}
			{@const base = meter.y + meter.height - 5}
			<g class="meter">
				<rect class="box" x={meter.x} y={meter.y} width={meter.width} height={meter.height} rx="4" />
				<path class="dial" d="M {centre - 8} {base} A 8 8 0 0 1 {centre + 8} {base}" />
				<line class="dial" x1={centre} y1={base} x2={centre + 6} y2={base - 10} />
			</g>
		{/each}
		{#if diagram.repeat}
			{@const { x1, x2, y, depth, label, labelX, labelY } = diagram.repeat}
			<path class="bracket" d="M {x1} {y} v {depth} H {x2} v {-depth}" />
			<text class="repeat" x={labelX} y={labelY}>{label}</text>
		{/if}
	</svg>
{/snippet}

<WidgetFrame>
	{@render picture(circuit, describeCircuit(kind))}
	{#if kind === "grover"}
		<button
			type="button"
			aria-expanded={diffusionShown}
			aria-controls={diffusionId}
			onclick={() => (diffusionShown = !diffusionShown)}
		>
			{diffusionShown ? "Hide D" : "Expand D"}
		</button>
		{#if diffusionShown}
			{@render picture(diffusionDiagram, diffusionDescription, diffusionId)}
		{/if}
	{/if}
</WidgetFrame>

<style>
.circuit {
	display: block;
	width: 100%;
	max-width: 24rem;
	height: auto;
	justify-self: center;
}
.lead,
.name {
	font-family: "STIX Two Math", math;
	font-weight: 400;
	fill: var(--fui-ink);
}
.wire {
	stroke: var(--fui-ink-secondary);
	stroke-width: 1.25;
}
.dot {
	fill: var(--fui-ink-secondary);
}
.lead {
	text-anchor: middle;
	dominant-baseline: central;
}
.box {
	fill: var(--fui-surface-raised);
	stroke: var(--fui-ink-muted);
	stroke-width: 1;
}
.query .box {
	fill: color-mix(in oklab, var(--fui-accent) 20%, var(--fui-surface-base));
	stroke: var(--fui-accent);
	stroke-width: 2;
}
.meter .box {
	fill: var(--fui-surface-base);
}
.dial {
	fill: none;
	stroke: var(--fui-ink);
	stroke-width: 1.25;
	stroke-linecap: round;
}
.bracket {
	fill: none;
	stroke: var(--fui-ink-secondary);
	stroke-width: 1.25;
	stroke-linejoin: round;
}
.repeat {
	font-family: var(--fui-font-sans);
	font-size: 12px;
	fill: var(--fui-ink);
	text-anchor: middle;
}
button {
	justify-self: center;
	padding: 0 1rem;
}
button[aria-expanded="true"] {
	border-color: var(--fui-accent);
}
@media print {
	button {
		display: none;
	}
	.box {
		print-color-adjust: exact;
	}
}
</style>
