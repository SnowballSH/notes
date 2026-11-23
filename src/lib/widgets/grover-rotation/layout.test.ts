import { describe, expect, it } from "vitest";
import { groverAngle } from "../../quantum/grover.ts";
import {
	arcPath,
	arrowBase,
	arrowHead,
	chanceLabelPoint,
	dipBelowAxis,
	heightSquare,
	labelAcrossAxisFrom,
	labelOutside,
	pictureHeight,
	pointAt,
	textSize,
	turnLabelPoint,
	unmarkedLabel,
} from "./layout.ts";
import { lastIteration, mostMarked, stateAngle } from "./rotation.ts";

describe("pointAt", () => {
	it("puts the unmarked axis on the right and the marked axis at the top", () => {
		expect(pointAt(0)).toEqual({ x: 252, y: 148 });
		expect(pointAt(Math.PI / 2).x).toBeCloseTo(132, 10);
		expect(pointAt(Math.PI / 2).y).toBeCloseTo(28, 10);
		expect(pointAt(Math.PI).x).toBeCloseTo(12, 10);
	});

	it("measures the angle anticlockwise at any distance", () => {
		const point = pointAt(Math.PI / 6, 100);
		expect(point.x).toBeCloseTo(218.6025, 4);
		expect(point.y).toBeCloseTo(98, 10);
	});
});

describe("arcPath", () => {
	it("sweeps anticlockwise on the page", () => {
		expect(arcPath(0, Math.PI / 2, 48)).toBe("M 180 148 A 48 48 0 0 0 132 100");
		expect(arcPath(Math.PI / 6, Math.PI / 2, 48)).toBe("M 173.57 124 A 48 48 0 0 0 132 100");
	});

	it("takes the long way round past a half turn", () => {
		expect(arcPath(0, (7 * Math.PI) / 6, 48)).toBe("M 180 148 A 48 48 0 1 0 90.43 172");
	});
});

describe("arrowHead", () => {
	it("points along the radius with its point on the circle", () => {
		expect(arrowHead(0)).toBe("252,148 242,152.5 242,143.5");
		expect(arrowHead(Math.PI / 2)).toBe("132,28 136.5,38 127.5,38");
	});

	it("starts where the shaft stops", () => {
		expect(arrowBase(0)).toEqual({ x: 242, y: 148 });
	});
});

describe("heightSquare", () => {
	it("has the height of the tip as its side and reaches down to the unmarked axis", () => {
		const square = heightSquare(Math.PI / 6);
		expect(square.side).toBeCloseTo(60, 10);
		expect(square.x).toBeCloseTo(175.923, 3);
		expect(square.y).toBeCloseTo(88, 10);
	});

	it("stays between the tip and the marked axis once the arrow has passed that axis", () => {
		const square = heightSquare((5 * Math.PI) / 6);
		expect(square.side).toBeCloseTo(60, 10);
		expect(square.x).toBeCloseTo(28.077, 3);
		expect(square.y).toBeCloseTo(88, 10);
	});

	it("hangs under the unmarked axis once the arrow has dipped below it", () => {
		const square = heightSquare((7 * Math.PI) / 6);
		expect(square.side).toBeCloseTo(60, 10);
		expect(square.x).toBeCloseTo(28.077, 3);
		expect(square.y).toBe(148);
	});

	it("fills the left quadrant when the arrow is on the marked axis", () => {
		const square = heightSquare(Math.PI / 2);
		expect(square.side).toBeCloseTo(120, 10);
		expect(square.x).toBeCloseTo(12, 10);
		expect(square.y).toBeCloseTo(28, 10);
	});

	it("stays inside the picture at every angle", () => {
		for (let angle = 0; angle <= (7 * Math.PI) / 6; angle += 0.01) {
			const square = heightSquare(angle);
			expect(square.x).toBeGreaterThanOrEqual(12 - 1e-9);
			expect(square.x + square.side).toBeLessThanOrEqual(252 + 1e-9);
		}
	});
});

describe("chanceLabelPoint", () => {
	it("is centred under the square", () => {
		const above = chanceLabelPoint(heightSquare(Math.PI / 6), 12);
		expect(above.x).toBeCloseTo(205.923, 3);
		expect(above.y).toBeCloseTo(162, 10);
		const below = chanceLabelPoint(heightSquare((7 * Math.PI) / 6), 12);
		expect(below.x).toBeCloseTo(58.077, 3);
		expect(below.y).toBeCloseTo(222, 10);
	});

	it("keeps its text within the width of the circle, clear of the unmarked label", () => {
		const first = heightSquare(stateAngle(256, 1, 0));
		expect(chanceLabelPoint(first, 10).x).toBeCloseTo(225, 10);
		expect(chanceLabelPoint(first, 13.67).x).toBeCloseTo(215.091, 10);
		expect(chanceLabelPoint(heightSquare(stateAngle(8, 1, 4)), 10).x).toBeCloseTo(39, 10);
		expect(unmarkedLabel).toEqual({ x: 262, y: 148, anchor: "start" });
	});
});

describe("pictureHeight", () => {
	const deepest = (size: number, marked: number): number =>
		stateAngle(size, marked, lastIteration(size, marked));

	it("measures how far a state is under the unmarked axis", () => {
		expect(dipBelowAxis(Math.PI / 3)).toBe(0);
		expect(dipBelowAxis((7 * Math.PI) / 6)).toBeCloseTo(60, 10);
		expect(dipBelowAxis(deepest(8, 1))).toBeCloseTo(13.258, 3);
	});

	it("leaves a line for the label under the deepest state", () => {
		expect(pictureHeight(Math.PI / 3)).toBe(174);
		expect(pictureHeight(deepest(8, 1))).toBe(188);
		expect(pictureHeight(deepest(4, 1))).toBe(174);
		expect(pictureHeight(deepest(32, 7))).toBe(206);
		expect(pictureHeight(1.25 * Math.PI)).toBe(259);
		expect(pictureHeight(deepest(256, 1))).toBe(180);
	});
});

describe("textSize", () => {
	it("is 12 pixels on the screen at any width of the picture", () => {
		expect(textSize(328)).toBe(12);
		expect(textSize(288)).toBe(13.67);
		expect(textSize(472)).toBe(8.34);
	});

	it("is 12 units before the picture is measured", () => {
		expect(textSize(0)).toBe(12);
	});
});

describe("labels", () => {
	it("puts a label outside the circle on the side its angle is on", () => {
		const right = labelOutside(Math.PI / 3);
		expect(right.anchor).toBe("start");
		expect(right.x).toBeCloseTo(203.5, 10);
		expect(right.y).toBeCloseTo(32.819, 3);
		const left = labelOutside((2 * Math.PI) / 3);
		expect(left.anchor).toBe("end");
		expect(left.x).toBeCloseTo(60.5, 10);
		expect(labelOutside(Math.PI / 2).anchor).toBe("start");
	});

	it("puts the axis label on the other side", () => {
		expect(labelAcrossAxisFrom(Math.PI / 3)).toEqual({ x: 126, y: 12, anchor: "end" });
		expect(labelAcrossAxisFrom(Math.PI / 2)).toEqual({ x: 126, y: 12, anchor: "end" });
		expect(labelAcrossAxisFrom(2)).toEqual({ x: 138, y: 12, anchor: "start" });
	});
});

describe("turnLabelPoint", () => {
	const turnOf = (size: number, iterations: number): [number, number] => [
		iterations === 0 ? 0 : stateAngle(size, 1, iterations - 1),
		stateAngle(size, 1, iterations),
	];

	it("sits on the bisector of a wide turn", () => {
		const label = turnLabelPoint(...turnOf(8, 1));
		expect(label.x).toBeCloseTo(179.25, 6);
		expect(label.y).toBeCloseTo(106.329, 3);
	});

	it("moves out along the bisector until both arrows are 10 away", () => {
		const label = turnLabelPoint(...turnOf(64, 1));
		expect(label.x).toBeCloseTo(209.5, 6);
		expect(label.y).toBeCloseTo(128.157, 3);
	});

	it("goes ahead of the arrow when the turn is too narrow and the arrow is still rising", () => {
		const first = turnLabelPoint(...turnOf(256, 0));
		expect(first.x).toBeCloseTo(193.455, 2);
		expect(first.y).toBeCloseTo(134.132, 2);
		const second = turnLabelPoint(...turnOf(256, 1));
		expect(second.x).toBeCloseTo(191.244, 2);
		expect(second.y).toBeCloseTo(126.573, 2);
	});

	it("goes behind the previous state once the arrow has passed the marked axis", () => {
		const label = turnLabelPoint(...turnOf(256, 13));
		expect(label.x).toBeCloseTo(142.452, 2);
		expect(label.y).toBeCloseTo(85.873, 2);
	});

	it("goes behind the previous state when the middle of the turn is on the unmarked axis", () => {
		const label = turnLabelPoint(...turnOf(4, 3));
		expect(label.x).toBeCloseTo(83.132, 3);
		expect(label.y).toBeCloseTo(108.239, 3);
	});

	it("stays between the arrows of a last turn whose middle is well above the unmarked axis", () => {
		const label = turnLabelPoint(...turnOf(8, 4));
		expect(label.x).toBeCloseTo(70.969, 3);
		expect(label.y).toBeCloseTo(132.374, 3);
	});

	it("keeps 10 clear of both arrows and of the unmarked axis for every setting", () => {
		for (let qubits = 2; qubits <= 8; qubits++) {
			for (let marked = 1; marked <= mostMarked(qubits); marked++) {
				const size = 2 ** qubits;
				for (let iterations = 0; iterations <= lastIteration(size, marked); iterations++) {
					const to = stateAngle(size, marked, iterations);
					const from = iterations === 0 ? 0 : to - 2 * groverAngle(size, marked);
					const label = turnLabelPoint(from, to);
					const distance = Math.hypot(label.x - 132, 148 - label.y);
					const angle = Math.atan2(148 - label.y, label.x - 132);
					expect(distance).toBeGreaterThanOrEqual(63 - 1e-9);
					expect(distance).toBeLessThanOrEqual(96 + 1e-9);
					expect(148 - label.y).toBeGreaterThanOrEqual(10 - 1e-9);
					expect(distance * Math.abs(Math.sin(angle - to))).toBeGreaterThanOrEqual(10 - 1e-9);
					if (iterations > 0) {
						expect(distance * Math.abs(Math.sin(angle - from))).toBeGreaterThanOrEqual(10 - 1e-9);
					}
				}
			}
		}
	});
});
