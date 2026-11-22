import { describe, expect, it } from "vitest";
import {
	amplitudeAt,
	columnAt,
	keyEdit,
	keyedAmplitude,
	normalise,
	presets,
	withAmplitude,
} from "./drawing";
import { hadamardOnEveryQubit } from "./state";

const squares = (values: readonly number[]): number =>
	values.reduce((sum, value) => sum + value ** 2, 0);

describe("where a pointer draws", () => {
	it("finds the column, staying on the chart", () => {
		expect(columnAt(0, 8)).toBe(0);
		expect(columnAt(0.49, 8)).toBe(3);
		expect(columnAt(0.999, 8)).toBe(7);
		expect(columnAt(1.2, 8)).toBe(7);
		expect(columnAt(-0.1, 8)).toBe(0);
	});

	it("reads +1 at the top, 0 in the middle and -1 at the bottom, in steps of 0.05", () => {
		expect(amplitudeAt(0)).toBe(1);
		expect(amplitudeAt(0.5)).toBe(0);
		expect(amplitudeAt(1)).toBe(-1);
		expect(amplitudeAt(0.26)).toBe(0.5);
		expect(amplitudeAt(0.83)).toBe(-0.65);
		expect(amplitudeAt(-0.3)).toBe(1);
		expect(amplitudeAt(1.4)).toBe(-1);
	});
});

describe("normalise", () => {
	it("keeps the direction and makes the squares sum to 1", () => {
		const state = normalise([1, -1, 0.5, 0]) ?? [];
		expect(squares(state)).toBeCloseTo(1, 12);
		expect((state[0] ?? 0) / (state[2] ?? 1)).toBeCloseTo(2, 12);
		expect(state[1]).toBeCloseTo(-(state[0] ?? 0), 12);
		expect(normalise([0, -0.3])).toEqual([0, -1]);
	});

	it("has no answer for a drawing with nothing in it", () => {
		expect(normalise([0, 0, 0, 0])).toBeUndefined();
	});
});

describe("withAmplitude", () => {
	it("clamps what it is given", () => {
		expect(withAmplitude([0, 0], 0, 3)).toEqual([1, 0]);
		expect(withAmplitude([0, 0], 1, -3)).toEqual([0, -1]);
	});
});

describe("keyEdit", () => {
	const pressed = (drawing: readonly number[], index: number, ...keys: string[]) =>
		keys.reduce<readonly number[]>((edited, key) => keyEdit(edited, index, key) ?? edited, drawing);

	it("returns exactly to the start after a step up and a step down", () => {
		expect(pressed([1, 0], 1, "ArrowUp", "ArrowDown")).toEqual([1, 0]);
		expect(pressed([1, 0], 1, "ArrowDown", "ArrowUp")).toEqual([1, 0]);
		expect(pressed([1, 0], 1, "PageUp", "PageDown")).toEqual([1, 0]);
		const uniform = [0.5, 0.5, 0.5, 0.5];
		expect(
			pressed(uniform, 2, "ArrowUp", "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowDown"),
		).toEqual(uniform);
		const steps = Array.from({ length: 7 }, () => "ArrowDown");
		const back = Array.from({ length: 7 }, () => "ArrowUp");
		expect(pressed(uniform, 0, ...steps, ...back)).toEqual(uniform);
	});

	it("edits the drawing as drawn, leaving the other bars alone", () => {
		expect(keyEdit([1, 0], 1, "ArrowUp")).toEqual([1, 0.1]);
		expect(keyEdit([1, 0, 0, 0], 3, "End")).toEqual([1, 0, 0, 1]);
		expect(keyEdit([1, 0.3], 1, "Delete")).toEqual([1, 0]);
	});

	it("does nothing on the only bar unless the key changes its sign", () => {
		expect(keyEdit([1, 0], 0, "ArrowDown")).toBeUndefined();
		expect(keyEdit([1, 0], 0, "ArrowUp")).toBeUndefined();
		expect(keyEdit([1, 0], 0, "PageDown")).toBeUndefined();
		expect(keyEdit([1, 0], 0, "End")).toBeUndefined();
		expect(keyEdit([1, 0], 0, "Delete")).toBeUndefined();
		expect(keyEdit([1, 0], 0, " ")).toEqual([-1, 0]);
		expect(keyEdit([1, 0], 0, "Home")).toEqual([-1, 0]);
	});

	it("does nothing for a key that means nothing or cannot move the bar", () => {
		expect(keyEdit([1, 0.5], 1, "Tab")).toBeUndefined();
		expect(keyEdit([1, 0.5], 0, "ArrowUp")).toBeUndefined();
		expect(keyEdit([1, 0], 1, "Enter")).toBeUndefined();
	});
});

describe("keyedAmplitude", () => {
	it("steps, jumps, flips and clears", () => {
		expect(keyedAmplitude(0.2, "ArrowUp")).toBeCloseTo(0.3, 12);
		expect(keyedAmplitude(0.2, "ArrowDown")).toBeCloseTo(0.1, 12);
		expect(keyedAmplitude(0.2, "PageUp")).toBeCloseTo(0.7, 12);
		expect(keyedAmplitude(0.2, "PageDown")).toBeCloseTo(-0.3, 12);
		expect(keyedAmplitude(0.2, "End")).toBe(1);
		expect(keyedAmplitude(0.2, "Home")).toBe(-1);
		expect(keyedAmplitude(0.2, " ")).toBe(-0.2);
		expect(keyedAmplitude(-0.2, "Enter")).toBe(0.2);
		expect(keyedAmplitude(0.2, "Delete")).toBe(0);
	});

	it("leaves other keys alone", () => {
		expect(keyedAmplitude(0.2, "Tab")).toBeUndefined();
		expect(keyedAmplitude(0.2, "a")).toBeUndefined();
	});
});

describe("presets", () => {
	it.each(Object.entries(presets))("%s is a unit vector of any size", (_, preset) => {
		for (const size of [2, 4, 8]) {
			expect(preset(size)).toHaveLength(size);
			expect(squares(preset(size))).toBeCloseTo(1, 12);
		}
	});

	it("are a basis state, its transform, and the transform of the last-bit basis state", () => {
		const uniform = hadamardOnEveryQubit(presets.basis(8));
		for (const [index, value] of presets.uniform(8).entries())
			expect(uniform[index]).toBeCloseTo(value, 12);
		const transformed = hadamardOnEveryQubit(presets.alternating(8));
		for (const [index, value] of [0, 1, 0, 0, 0, 0, 0, 0].entries())
			expect(transformed[index]).toBeCloseTo(value, 12);
	});
});
