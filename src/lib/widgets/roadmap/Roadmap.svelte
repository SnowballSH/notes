<script lang="ts">
import { onMount } from "svelte";
import { walshHadamard } from "../../outlines/walsh-hadamard.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import { dependencies, destination } from "./dependencies.ts";
import { boxCell, connectors, gridLines, layerCount, placements, placeOf } from "./layout.ts";
import { loadPublishedNotes } from "./published.ts";
import { needsText, roadmapSections } from "./sections.ts";

const sections = roadmapSections(walshHadamard, dependencies).map((section) => ({
	...section,
	cell: boxCell(placeOf(section.number)),
	spoken: needsText(section.needs),
}));
const arrows = connectors(dependencies);
const gaps = layerCount(placements) - 1;

let published = $state<ReadonlySet<string>>(new Set());

onMount(async () => {
	published = await loadPublishedNotes((address) => fetch(address));
});
</script>

<WidgetFrame>
	<div class="roadmap">
		<div class="chart" style:--gaps={gaps}>
			<ol class="sections" role="list" aria-label="Course roadmap">
				{#each sections as { number, title, href, cell, spoken } (number)}
					{@const linked = href !== null && published.has(href)}
					<li
						class="box"
						class:planned={!linked}
						class:destination={number === destination}
						style:--flow={gridLines(cell.flow)}
						style:--cross={gridLines(cell.cross)}
					>
						{#if linked}
							<a class="label" {href}>
								<span class="number">{number}</span> <span class="title">{title}</span>
							</a>
						{:else}
							<span class="label">
								<span class="number">{number}</span> <span class="title">{title}</span>
							</span>
						{/if}
						{#if spoken}<span class="spoken">{spoken}</span>{/if}
					</li>
				{/each}
			</ol>
			<div class="arrows" aria-hidden="true">
				{#each arrows as arrow (`${arrow.from} ${arrow.to} ${arrow.shape}`)}
					<span
						class="connector {arrow.shape}"
						style:--flow={gridLines(arrow.flow)}
						style:--cross={gridLines(arrow.cross)}
					></span>
				{/each}
			</div>
		</div>
	</div>
</WidgetFrame>

<style>
.roadmap {
	width: 100%;
	container-type: inline-size;
}
.chart {
	--line: var(--fui-ink-muted);
	--stroke: 1.5px;
	--flow-gap: 1.5rem;
	--cross-gap: 1rem;
	--rail: 1rem;
	--head-width: 0.5625rem;
	--head-length: 0.4375rem;
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) var(--cross-gap) minmax(0, 1fr) var(--rail);
	grid-template-rows: repeat(var(--gaps), auto var(--flow-gap)) auto;
	max-width: 26rem;
	font-size: 0.8125rem;
	line-height: 1.3;
}
.chart .sections,
.chart .arrows {
	grid-area: 1 / 1 / -1 / -1;
	display: grid;
	grid-template-columns: subgrid;
	grid-template-rows: subgrid;
	margin: 0;
	padding: 0;
	list-style: none;
}
.chart .arrows {
	pointer-events: none;
}
.chart .box,
.chart .connector {
	grid-row: var(--flow);
	grid-column: var(--cross);
	margin: 0;
}
.box {
	position: relative;
	display: grid;
	min-width: 0;
	min-height: 2.75rem;
	border: 1px solid var(--fui-ink-muted);
	border-radius: var(--fui-radius-sm);
	background: var(--fui-surface-raised);
	color: var(--fui-ink);
}
.box.planned {
	border-style: dashed;
	background: var(--fui-surface-base);
	color: var(--fui-ink-muted);
}
.box.destination {
	border-width: 2px;
	border-color: var(--fui-accent);
	background: color-mix(in oklab, var(--fui-accent) 12%, var(--fui-surface-base));
	color: var(--fui-ink);
	font-weight: 600;
}
.box .label {
	display: grid;
	align-content: center;
	gap: 0.125rem;
	min-width: 0;
	padding: 0.5rem 0.625rem;
	border-radius: inherit;
	color: inherit;
	text-decoration: none;
	overflow-wrap: anywhere;
}
.number {
	font-family: var(--fui-font-mono);
	font-size: 0.75rem;
	font-variant-numeric: tabular-nums;
}
.box a .title {
	color: var(--fui-accent-strong);
	text-decoration: underline dotted;
	text-underline-offset: 0.2em;
}
.box a:hover .title {
	text-decoration-style: solid;
}
.box a:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
.box .spoken {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: 0;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
.connector {
	position: relative;
}
.connector::before,
.connector::after {
	position: absolute;
}
.connector::before {
	content: "";
	border: 0 solid var(--line);
}
.step::after,
.branch-end::after,
.skip-end::after {
	content: "";
	background: var(--line);
}
/* Each piece draws its line with the borders of a box that ends on the middle of its grid cell. */
@container (width < 40rem) {
	.step::before {
		inset: 0 50% 0 0;
		border-right-width: var(--stroke);
	}
	.branch-start::before {
		inset: 0 calc(-1 * var(--cross-gap)) 50% 50%;
		border-bottom-width: var(--stroke);
	}
	.branch-end::before {
		inset: calc(50% - var(--stroke)) 50% 0 0;
		border-top-width: var(--stroke);
		border-right-width: var(--stroke);
		border-top-right-radius: var(--fui-radius-sm);
	}
	.step::after,
	.branch-end::after {
		bottom: 0;
		left: calc(50% - var(--stroke) / 2 - var(--head-width) / 2);
		width: var(--head-width);
		height: var(--head-length);
		clip-path: polygon(0 0, 100% 0, 50% 100%);
	}
	.skip-start::before {
		inset: calc(50% - var(--stroke)) 0 0 0;
		border-top-width: var(--stroke);
		border-right-width: var(--stroke);
		border-top-right-radius: var(--fui-radius-sm);
	}
	.skip-rail::before {
		inset: 0;
		border-right-width: var(--stroke);
	}
	.skip-end::before {
		inset: 0 0 50% 0;
		border-right-width: var(--stroke);
		border-bottom-width: var(--stroke);
		border-bottom-right-radius: var(--fui-radius-sm);
	}
	.skip-end::after {
		left: 0;
		top: calc(50% - var(--stroke) / 2 - var(--head-width) / 2);
		width: var(--head-length);
		height: var(--head-width);
		clip-path: polygon(100% 0, 100% 100%, 0 50%);
	}
}
@container (width >= 40rem) {
	.chart {
		grid-template-columns: repeat(var(--gaps), minmax(0, 1fr) var(--flow-gap)) minmax(0, 1fr);
		grid-template-rows: auto var(--cross-gap) auto var(--rail);
		max-width: none;
	}
	.chart .box,
	.chart .connector {
		grid-row: var(--cross);
		grid-column: var(--flow);
	}
	.step::before {
		inset: 0 0 50% 0;
		border-bottom-width: var(--stroke);
	}
	.branch-start::before {
		inset: 50% 50% calc(-1 * var(--cross-gap)) 0;
		border-right-width: var(--stroke);
	}
	.branch-end::before {
		inset: 0 0 50% calc(50% - var(--stroke));
		border-left-width: var(--stroke);
		border-bottom-width: var(--stroke);
		border-bottom-left-radius: var(--fui-radius-sm);
	}
	.step::after,
	.branch-end::after {
		right: 0;
		top: calc(50% - var(--stroke) / 2 - var(--head-width) / 2);
		width: var(--head-length);
		height: var(--head-width);
		clip-path: polygon(0 0, 100% 50%, 0 100%);
	}
	.skip-start::before {
		inset: 0 0 0 calc(50% - var(--stroke));
		border-left-width: var(--stroke);
		border-bottom-width: var(--stroke);
		border-bottom-left-radius: var(--fui-radius-sm);
	}
	.skip-rail::before {
		inset: 0;
		border-bottom-width: var(--stroke);
	}
	.skip-end::before {
		inset: 0 50% 0 0;
		border-right-width: var(--stroke);
		border-bottom-width: var(--stroke);
		border-bottom-right-radius: var(--fui-radius-sm);
	}
	.skip-end::after {
		top: 0;
		left: calc(50% - var(--stroke) / 2 - var(--head-width) / 2);
		width: var(--head-width);
		height: var(--head-length);
		clip-path: polygon(50% 0, 100% 100%, 0 100%);
	}
}
@media print {
	.box a .title {
		color: inherit;
		text-decoration: none;
	}
	.box,
	.connector::after {
		print-color-adjust: exact;
	}
}
</style>
