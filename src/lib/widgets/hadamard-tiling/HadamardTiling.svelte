<script lang="ts">
import { flushSync, onDestroy, untrack } from "svelte";
import { prefersReducedMotion } from "svelte/motion";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";
import { entryLabels, gridPath } from "./grid.ts";
import { hadamardTile } from "./matrix.ts";

const Stage = { Whole: 0, Shrunk: 1, Spread: 2, Flipped: 3 } as const;
type Stage = (typeof Stage)[keyof typeof Stage];

interface Step {
	stage: Stage;
	caption: string;
}

const construction: readonly Step[] = [
	{ stage: Stage.Shrunk, caption: "Shrink it into the top-left quarter." },
	{ stage: Stage.Spread, caption: "Copy it into the other three quarters." },
	{ stage: Stage.Flipped, caption: "Negate the bottom-right copy." },
];
const reversal: readonly Step[] = [
	{ stage: Stage.Spread, caption: "Restore the bottom-right copy." },
	{ stage: Stage.Shrunk, caption: "Stack the copies in the top-left quarter." },
	{ stage: Stage.Whole, caption: "Enlarge it to fill the board." },
];

const moveMilliseconds = 1000;
const restMilliseconds = 450;
const quarters = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

const { start, max }: WidgetProps<typeof definition> = $props();
const highest = untrack(() => max);
const first = untrack(() => Math.min(start, highest));

let level = $state(first);
let stage = $state<Stage>(Stage.Whole);
let exponent = $state(first);
let playing = $state(false);
let narration = $state<string>();
let still = $state(false);
let board = $state<HTMLElement>();
let alive = true;
onDestroy(() => {
	alive = false;
});

const order = $derived(2 ** exponent);
// The font size of an entry as a fraction of the board.
const entrySize = 0.055;
const resting = $derived(stage === Stage.Whole || stage === Stage.Flipped);
const gridLevel = $derived(stage === Stage.Flipped ? level + 1 : level);

let queued: 1 | -1 | undefined;
let endPause: (() => void) | undefined;

const pause = (milliseconds: number) =>
	new Promise<void>((resolve) => {
		const timer = setTimeout(resolve, milliseconds);
		endPause = () => {
			clearTimeout(timer);
			resolve();
		};
	});

function regroup(nextLevel: number, nextStage: Stage): void {
	still = true;
	level = nextLevel;
	stage = nextStage;
	flushSync();
	// Reading the layout commits the repositioned tiles before transitions come back on.
	void board?.offsetWidth;
	still = false;
	flushSync();
}

async function play(steps: readonly Step[]): Promise<void> {
	const last = steps.at(-1)?.stage ?? stage;
	if (prefersReducedMotion.current) {
		stage = last;
		return;
	}
	for (const [index, step] of steps.entries()) {
		if (index > 0) await pause(restMilliseconds);
		if (!alive) return;
		if (queued !== undefined) break;
		stage = step.stage;
		narration = step.caption;
		await pause(moveMilliseconds);
		if (queued !== undefined) break;
	}
	if (queued !== undefined) regroup(level, last);
}

async function animate(by: 1 | -1): Promise<void> {
	if (by === 1) {
		if (stage === Stage.Flipped) regroup(level + 1, Stage.Whole);
		await play(construction);
	} else {
		if (stage === Stage.Whole) regroup(level - 1, Stage.Flipped);
		await play(reversal);
	}
}

// A press during an animation jumps to its end, then starts the new move.
async function move(by: 1 | -1): Promise<void> {
	const target = exponent + by;
	if (target < 0 || target > highest) return;
	if (playing) {
		queued = by;
		endPause?.();
		return;
	}
	playing = true;
	exponent = target;
	try {
		await animate(by);
	} finally {
		playing = false;
		narration = undefined;
	}
	const next = queued;
	queued = undefined;
	if (next !== undefined && alive) await move(next);
}

function moveByArrowKey(event: KeyboardEvent): void {
	const by = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : undefined;
	if (by === undefined || event.altKey || event.ctrlKey || event.metaKey) return;
	event.preventDefault();
	void move(by);
}
</script>

<WidgetFrame>
	<!-- svelte-ignore a11y_no_static_element_interactions: the keys reach it only from its buttons -->
	<div class="controls" onkeydown={moveByArrowKey}>
		<button
			type="button"
			aria-label="Previous matrix"
			aria-disabled={exponent <= 0}
			onclick={() => move(-1)}>&larr;</button
		>
		<span class="order" aria-live="polite">n = {exponent}</span>
		<button
			type="button"
			aria-label="Next matrix"
			aria-disabled={exponent >= highest}
			onclick={() => move(1)}>&rarr;</button
		>
	</div>
	<div
		class="board"
		bind:this={board}
		data-stage={stage}
		data-still={still ? "" : undefined}
		style:--move="{moveMilliseconds}ms"
		role="img"
		aria-label="The {order} by {order} Walsh-Hadamard matrix, with +1 white and -1 black"
	>
		{#each quarters as quarter (quarter)}
			<canvas class={quarter} {@attach hadamardTile(level)}></canvas>
		{/each}
		<svg
			class:resting
			viewBox="0 0 {2 ** gridLevel} {2 ** gridLevel}"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<path d={gridPath(gridLevel)} />
			{#each entryLabels(gridLevel) as entry (`${entry.x} ${entry.y}`)}
				<text
					x={entry.x}
					y={entry.y}
					font-size={entrySize * 2 ** gridLevel}
					class:negative={entry.negative}>{entry.text}</text
				>
			{/each}
		</svg>
	</div>
	{#snippet caption()}
		<p class="spoken">{narration ?? `The ${order} by ${order} matrix.`}</p>
	{/snippet}
</WidgetFrame>

<style>
.controls {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-family: var(--fui-font-mono);
}
.order {
	min-width: 4rem;
	text-align: center;
}
button {
	width: 2.75rem;
	height: 2.75rem;
}
.board {
	position: relative;
	box-sizing: content-box;
	width: min(100% - 2px, 20rem);
	aspect-ratio: 1;
	overflow: hidden;
	border: 1px solid var(--fui-line);
	background: white;
	filter: var(--note-figure-filter, none);
}
svg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	opacity: 0;
}
svg.resting {
	opacity: 1;
	/* Waits for the tiles to enlarge, so the lines never cross moving tiles. */
	transition: opacity 200ms ease-out var(--move);
}
text {
	fill: black;
	font-family: var(--fui-font-mono);
	text-anchor: middle;
	dominant-baseline: central;
}
text.negative {
	fill: white;
}
path {
	fill: none;
	stroke: var(--fui-ink-muted);
	stroke-width: 1;
	vector-effect: non-scaling-stroke;
	shape-rendering: crispEdges;
}
canvas {
	position: absolute;
	inset: 0 auto auto 0;
	width: 50%;
	height: 50%;
	transform-origin: 0 0;
	image-rendering: pixelated;
	transition:
		transform var(--move) ease-in-out,
		filter var(--move) ease-in-out;
}
[data-still] canvas {
	transition: none;
}
[data-stage="0"] canvas {
	transform: scale(2);
}
:is([data-stage="2"], [data-stage="3"]) .top-right {
	transform: translate(100%, 0);
}
:is([data-stage="2"], [data-stage="3"]) .bottom-left {
	transform: translate(0, 100%);
}
:is([data-stage="2"], [data-stage="3"]) .bottom-right {
	transform: translate(100%, 100%);
}
[data-stage="3"] .bottom-right {
	filter: invert(1);
}
@media (prefers-reduced-motion: reduce) {
	canvas,
	svg.resting {
		transition: none;
	}
}
@media print {
	button {
		display: none;
	}
}
</style>
