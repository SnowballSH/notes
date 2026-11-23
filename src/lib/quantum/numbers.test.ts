import { describe, expect, it } from "vitest";
import { clamp } from "./numbers";

describe("clamp", () => {
	it("leaves a value inside the range as it is", () => {
		expect(clamp(0.25, -1, 1)).toBe(0.25);
		expect(clamp(-1, -1, 1)).toBe(-1);
		expect(clamp(1, -1, 1)).toBe(1);
	});

	it("moves a value outside the range to the nearer end", () => {
		expect(clamp(-3, 0, 7)).toBe(0);
		expect(clamp(9, 0, 7)).toBe(7);
		expect(clamp(5, 2, 2)).toBe(2);
	});
});
