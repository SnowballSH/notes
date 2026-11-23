import { describe, expect, it } from "vitest";
import { finestGridLevel, gridPath } from "./grid.ts";

describe("gridPath", () => {
	it("has nothing to separate in the 1 by 1 matrix", () => {
		expect(gridPath(0)).toBe("");
	});

	it("draws one line each way through the 2 by 2 matrix", () => {
		expect(gridPath(1)).toBe("M1 0V2M0 1H2");
	});

	it("draws every inner line of the 4 by 4 matrix, columns first", () => {
		expect(gridPath(2)).toBe("M1 0V4M2 0V4M3 0V4M0 1H4M0 2H4M0 3H4");
	});

	it("stops after the 8 by 8 matrix", () => {
		expect(finestGridLevel).toBe(3);
		expect(gridPath(3).match(/M/g)).toHaveLength(14);
		expect(gridPath(4)).toBe("");
		expect(gridPath(6)).toBe("");
	});
});
