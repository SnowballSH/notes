<script lang="ts">
import { flushSync, onDestroy, untrack } from "svelte";
import { hadamardTile } from "./hadamard/matrix.ts";

interface Props {
	start?: number;
	max?: number;
}

const Stage = { Whole: 0, Shrunk: 1, Spread: 2, Flipped: 3 } as const;
type Stage = (typeof Stage)[keyof typeof Stage];

const largestLevel = 6;
const moveMilliseconds = 1000;
const restMilliseconds = 450;
const quarters = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

const { start = 1, max = 6 }: Props = $props();
const clamp = (value: number, low: number, high: number) =>
	Math.min(Math.max(Math.round(value), low), high);
const highest = untrack(() => clamp(max, 1, largestLevel));

const first = untrack(() => clamp(start, 0, highest));

let level = $state(first);
let stage = $state<Stage>(Stage.Whole);
let exponent = $state(first);
let playing = $state(false);
let still = $state(false);
let board = $state<HTMLElement>();
let alive = true;
onDestroy(() => {
	alive = false;
});

const order = $derived(2 ** exponent);

const pause = (milliseconds: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const prefersStillness = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

async function play(stages: readonly Stage[]): Promise<void> {
	if (prefersStillness()) {
		stage = stages.at(-1) ?? stage;
		return;
	}
	for (const [index, next] of stages.entries()) {
		if (index > 0) await pause(restMilliseconds);
		if (!alive) return;
		stage = next;
		await pause(moveMilliseconds);
	}
}

async function move(by: 1 | -1): Promise<void> {
	const target = exponent + by;
	if (playing || target < 0 || target > highest) return;
	playing = true;
	exponent = target;
	try {
		if (by === 1) {
			if (stage === Stage.Flipped) regroup(level + 1, Stage.Whole);
			await play([Stage.Shrunk, Stage.Spread, Stage.Flipped]);
		} else {
			if (stage === Stage.Whole) regroup(level - 1, Stage.Flipped);
			await play([Stage.Spread, Stage.Shrunk, Stage.Whole]);
		}
	} finally {
		playing = false;
	}
}
</script>

<figure class="tiling">
	<div class="controls">
		<button
			type="button"
			aria-label="Previous matrix"
			aria-disabled={playing || exponent <= 0}
			onclick={() => move(-1)}>&larr;</button
		>
		<span class="order" aria-live="polite">n = {exponent}</span>
		<button
			type="button"
			aria-label="Next matrix"
			aria-disabled={playing || exponent >= highest}
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
	</div>
</figure>

<style>
.tiling {
	margin: 0;
	display: grid;
	gap: 0.75rem;
	justify-items: start;
}
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
	width: 2.25rem;
	height: 2.25rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	cursor: pointer;
}
button[aria-disabled="true"] {
	color: var(--fui-ink-muted);
	cursor: default;
}
button:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
.board {
	position: relative;
	box-sizing: content-box;
	width: min(100% - 2px, 20rem);
	aspect-ratio: 1;
	overflow: hidden;
	border: 1px solid var(--fui-line);
	background: white;
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
	canvas {
		transition: none;
	}
}
</style>
