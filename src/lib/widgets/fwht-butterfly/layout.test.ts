import { describe, expect, it } from "vitest";
import {
	columnCentre,
	headingAt,
	heightFor,
	maxWidth,
	minWidth,
	nodeHeight,
	nodeWidth,
	reachBox,
	rowCentre,
	rowPitch,
	widthFor,
	wireSegment,
} from "./layout";

describe("the layout of the butterfly diagram", () => {
	it("is as wide as the note between 288 and 480 units", () => {
		expect([minWidth, maxWidth]).toEqual([288, 480]);
		expect([200, 288, 357.5, 480, 736].map(widthFor)).toEqual([288, 288, 357.5, 480, 480]);
	});

	it("spreads four columns across the width with a margin of 6 units", () => {
		expect([0, 1, 2, 3].map((level) => columnCentre(level, 3, 288))).toEqual([24, 104, 184, 264]);
		expect([0, 1, 2, 3].map((level) => columnCentre(level, 3, 480))).toEqual([24, 168, 312, 456]);
		expect(columnCentre(0, 3, 288) - nodeWidth / 2).toBe(6);
		expect(columnCentre(3, 3, 288) + nodeWidth / 2).toBe(282);
		expect(columnCentre(3, 3, 480) + nodeWidth / 2).toBe(474);
	});

	it("stacks eight rows under the headings without touching", () => {
		expect(heightFor(8)).toBe(372);
		expect(rowCentre(0)).toBe(42);
		expect(rowCentre(7)).toBe(350);
		expect(rowCentre(7) + nodeHeight / 2).toBeLessThan(heightFor(8) - 3);
		expect(rowPitch - nodeHeight).toBe(20);
	});

	it("gives every entry a 44 by 44 pointer target inside the picture", () => {
		expect(reachBox(0, 0, 3, 288)).toEqual({ x: 2, y: 20, width: 44, height: 44 });
		expect(reachBox(1, 2, 3, 288)).toEqual({ x: 82, y: 108, width: 44, height: 44 });
		expect(reachBox(3, 7, 3, 288)).toEqual({ x: 242, y: 328, width: 44, height: 44 });
		expect(reachBox(3, 7, 3, 480)).toEqual({ x: 434, y: 328, width: 44, height: 44 });
		expect(reachBox(3, 7, 3, 288).y + rowPitch).toBe(heightFor(8));
	});

	it("keeps the outer headings inside the picture", () => {
		expect(headingAt(0, 3, 288)).toEqual({ x: 6, anchor: "start" });
		expect(headingAt(1, 3, 288)).toEqual({ x: 104, anchor: "middle" });
		expect(headingAt(3, 3, 288)).toEqual({ x: 282, anchor: "end" });
		expect(headingAt(3, 3, 480)).toEqual({ x: 474, anchor: "end" });
	});

	it("runs a wire from the edge of one node to the edge of the next", () => {
		expect(wireSegment(3, 3, 7, 3, 288)).toEqual({ x1: 202, y1: 174, x2: 246, y2: 350 });
		expect(wireSegment(1, 1, 1, 3, 288)).toEqual({ x1: 42, y1: 86, x2: 86, y2: 86 });
		expect(wireSegment(1, 1, 1, 3, 480)).toEqual({ x1: 42, y1: 86, x2: 150, y2: 86 });
	});
});
