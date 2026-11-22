import { describe, expect, it } from "vitest";
import { sampleIndex } from "./sampling";

describe("sampleIndex", () => {
	it("picks the outcome whose interval holds the random point", () => {
		const fair = [0.5, 0.5];
		expect(sampleIndex(fair, () => 0)).toBe(0);
		expect(sampleIndex(fair, () => 0.4999)).toBe(0);
		expect(sampleIndex(fair, () => 0.5)).toBe(1);
		expect(sampleIndex(fair, () => 0.9999)).toBe(1);
		expect(sampleIndex([0.125, 0.125, 0.25, 0.5], () => 0.3)).toBe(2);
	});

	it("never picks an impossible outcome", () => {
		expect(sampleIndex([1, 0], () => 0.9999)).toBe(0);
		expect(sampleIndex([0, 1], () => 0)).toBe(1);
		expect(sampleIndex([0, 0.5, 0, 0.5, 0], () => 0.9999)).toBe(3);
	});

	it("falls back to the last possible outcome when rounding leaves a gap below 1", () => {
		expect(sampleIndex([0.3, 0.3, 0.3, 0], () => 0.95)).toBe(2);
	});
});
