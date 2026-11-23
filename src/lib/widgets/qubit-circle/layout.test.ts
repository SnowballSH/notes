import { describe, expect, it } from "vitest";
import { anchorAt, pointAtAngle, pointOf } from "./layout.ts";

describe("pointOf", () => {
	it("puts |0⟩ on the right and |1⟩ at the top", () => {
		expect(pointOf([1, 0])).toEqual({ x: 240, y: 144 });
		expect(pointOf([0, 1])).toEqual({ x: 144, y: 48 });
		expect(pointOf([-1, 0])).toEqual({ x: 48, y: 144 });
		expect(pointOf([0, -1])).toEqual({ x: 144, y: 240 });
	});

	it("scales to another distance from the centre", () => {
		expect(pointOf([0, 1], 110)).toEqual({ x: 144, y: 34 });
	});
});

describe("pointAtAngle", () => {
	it("measures the angle anticlockwise from |0⟩", () => {
		const point = pointAtAngle(Math.PI / 6, 100);
		expect(point.x).toBeCloseTo(230.6025, 4);
		expect(point.y).toBeCloseTo(94, 10);
	});
});

describe("anchorAt", () => {
	it("anchors a label on the side facing the circle", () => {
		expect(anchorAt(0)).toBe("start");
		expect(anchorAt(Math.PI / 4)).toBe("start");
		expect(anchorAt(Math.PI / 2)).toBe("middle");
		expect(anchorAt(Math.PI)).toBe("end");
		expect(anchorAt(-Math.PI / 4)).toBe("start");
	});
});
