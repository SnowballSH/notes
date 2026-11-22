import { describe, expect, it } from "vitest";
import {
	columnCentre,
	headingAt,
	heightFor,
	nodeHeight,
	nodeWidth,
	reachBox,
	rowCentre,
	rowPitch,
	width,
	wireSegment,
} from "./layout";

describe("the layout of the butterfly diagram", () => {
	it("spreads four columns across 288 units with room for a focus ring", () => {
		expect([0, 1, 2, 3].map((level) => columnCentre(level, 3))).toEqual([21, 103, 185, 267]);
		expect(columnCentre(0, 3) - nodeWidth / 2).toBe(3);
		expect(columnCentre(3, 3) + nodeWidth / 2).toBe(width - 3);
	});

	it("stacks eight rows under the headings without touching", () => {
		expect(heightFor(8)).toBe(372);
		expect(rowCentre(0)).toBe(42);
		expect(rowCentre(7)).toBe(350);
		expect(rowCentre(7) + nodeHeight / 2).toBeLessThan(heightFor(8) - 3);
		expect(rowPitch - nodeHeight).toBe(20);
	});

	it("gives every entry a 44 by 44 pointer target inside the picture", () => {
		expect(reachBox(0, 0, 3)).toEqual({ x: 0, y: 20, width: 44, height: 44 });
		expect(reachBox(1, 2, 3)).toEqual({ x: 81, y: 108, width: 44, height: 44 });
		expect(reachBox(3, 7, 3)).toEqual({ x: 244, y: 328, width: 44, height: 44 });
		expect(reachBox(3, 7, 3).y + rowPitch).toBe(heightFor(8));
	});

	it("keeps the outer headings inside the picture", () => {
		expect(headingAt(0, 3)).toEqual({ x: 3, anchor: "start" });
		expect(headingAt(1, 3)).toEqual({ x: 103, anchor: "middle" });
		expect(headingAt(3, 3)).toEqual({ x: 285, anchor: "end" });
	});

	it("runs a wire from the edge of one node to the edge of the next", () => {
		expect(wireSegment(3, 3, 7, 3)).toEqual({ x1: 203, y1: 174, x2: 249, y2: 350 });
		expect(wireSegment(1, 1, 1, 3)).toEqual({ x1: 39, y1: 86, x2: 85, y2: 86 });
	});
});
