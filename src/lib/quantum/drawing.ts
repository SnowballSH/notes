import type { Amplitudes } from "./state.ts";

const snap = 0.05;
const smallStep = 0.1;
const largeStep = 0.5;

const clamp = (value: number, low: number, high: number): number =>
	Math.min(Math.max(value, low), high);

/** The column under a pointer that is the given fraction of the way across the chart. */
export const columnAt = (across: number, columns: number): number =>
	clamp(Math.floor(across * columns), 0, columns - 1);

/** The amplitude drawn at a fraction of the way down a plot whose top is +1 and bottom is -1. */
export const amplitudeAt = (down: number): number => {
	const snapped = Math.round((1 - 2 * down) / snap) * snap;
	return clamp(Number(snapped.toFixed(2)), -1, 1);
};

/** The unit vector in the direction of a drawing, which the zero vector does not have. */
export function normalise(drawing: readonly number[]): Amplitudes | undefined {
	const length = Math.hypot(...drawing);
	return length < 1e-9 ? undefined : drawing.map((value) => value / length);
}

export const withAmplitude = (
	drawing: readonly number[],
	index: number,
	amplitude: number,
): number[] => drawing.with(index, clamp(amplitude, -1, 1));

/** What a key pressed on a bar makes of its amplitude, if the key means anything there. */
export function keyedAmplitude(amplitude: number, key: string): number | undefined {
	switch (key) {
		case "ArrowUp":
		case "ArrowRight":
			return amplitude + smallStep;
		case "ArrowDown":
		case "ArrowLeft":
			return amplitude - smallStep;
		case "PageUp":
			return amplitude + largeStep;
		case "PageDown":
			return amplitude - largeStep;
		case "End":
			return 1;
		case "Home":
			return -1;
		case " ":
		case "Enter":
			return -amplitude;
		case "0":
		case "Backspace":
		case "Delete":
			return 0;
		default:
			return undefined;
	}
}

const withoutRoundingNoise = (value: number): number => Number(value.toFixed(10));

const sameDirection = (first: Amplitudes, second: Amplitudes): boolean =>
	first.every((amplitude, index) => Math.abs(amplitude - (second[index] ?? 0)) < 1e-12);

/**
 * The drawing after a key is pressed on one of its bars, or nothing if the key means
 * nothing there or would leave the normalised state as it is. The drawing is edited as
 * drawn, not renormalised, so that a step up and a step down return to where they began.
 */
export function keyEdit(
	drawing: readonly number[],
	index: number,
	key: string,
): readonly number[] | undefined {
	const amplitude = keyedAmplitude(drawing[index] ?? 0, key);
	if (amplitude === undefined) return undefined;
	const edited = withAmplitude(drawing, index, withoutRoundingNoise(amplitude));
	const before = normalise(drawing);
	const after = normalise(edited);
	return before && after && !sameDirection(before, after) ? edited : undefined;
}

export const presets = {
	basis: (size: number) => Array.from({ length: size }, (_, index) => (index === 0 ? 1 : 0)),
	uniform: (size: number) => Array.from({ length: size }, () => size ** -0.5),
	alternating: (size: number) =>
		Array.from({ length: size }, (_, index) => (index % 2 === 0 ? 1 : -1) * size ** -0.5),
} as const satisfies Record<string, (size: number) => Amplitudes>;

export type Preset = keyof typeof presets;
