import { describe, expect, it } from "vitest";
import { groverAngle } from "../../quantum/grover.ts";
import {
	arcPath,
	arrowBase,
	arrowHead,
	heightSquare,
	labelAcrossAxisFrom,
	labelOutside,
	pointAt,
	turnLabelPoint,
} from "./layout.ts";
import { lastIteration, mostMarked, stateAngle } from "./rotation.ts";

describe("pointAt", () => {
	it("puts the unmarked axis on the right and the marked axis at the top", () => {
		expect(pointAt(0)).toEqual({ x: 264, y: 148 });
		expect(pointAt(Math.PI / 2).x).toBeCloseTo(144, 10);
		expect(pointAt(Math.PI / 2).y).toBeCloseTo(28, 10);
		expect(pointAt(Math.PI).x).toBeCloseTo(24, 10);
	});

	it("measures the angle anticlockwise at any distance", () => {
		const point = pointAt(Math.PI / 6, 100);
		expect(point.x).toBeCloseTo(230.6025, 4);
		expect(point.y).toBeCloseTo(98, 10);
	});
});

describe("arcPath", () => {
	it("sweeps anticlockwise on the page", () => {
		expect(arcPath(0, Math.PI / 2, 48)).toBe("M 192 148 A 48 48 0 0 0 144 100");
		expect(arcPath(Math.PI / 6, Math.PI / 2, 48)).toBe("M 185.57 124 A 48 48 0 0 0 144 100");
	});
});

describe("arrowHead", () => {
	it("points along the radius with its point on the circle", () => {
		expect(arrowHead(0)).toBe("264,148 254,152.5 254,143.5");
		expect(arrowHead(Math.PI / 2)).toBe("144,28 148.5,38 139.5,38");
	});

	it("starts where the shaft stops", () => {
		expect(arrowBase(0)).toEqual({ x: 254, y: 148 });
	});
});

describe("heightSquare", () => {
	it("has the height of the tip as its side and reaches down to the unmarked axis", () => {
		const square = heightSquare(Math.PI / 6);
		expect(square.side).toBeCloseTo(60, 10);
		expect(square.x).toBeCloseTo(187.923, 3);
		expect(square.y).toBeCloseTo(88, 10);
	});

	it("turns to the other side once the arrow has passed the marked axis", () => {
		const square = heightSquare((5 * Math.PI) / 6);
		expect(square.side).toBeCloseTo(60, 10);
		expect(square.x).toBeCloseTo(40.077, 3);
		expect(square.y).toBeCloseTo(88, 10);
	});

	it("fills the left quadrant when the arrow is on the marked axis", () => {
		const square = heightSquare(Math.PI / 2);
		expect(square.side).toBeCloseTo(120, 10);
		expect(square.x).toBeCloseTo(24, 10);
		expect(square.y).toBeCloseTo(28, 10);
	});

	it("stays inside the picture at every angle", () => {
		for (let angle = 0; angle <= Math.PI; angle += 0.01) {
			const square = heightSquare(angle);
			expect(square.x).toBeGreaterThanOrEqual(24 - 1e-9);
			expect(square.x + square.side).toBeLessThanOrEqual(264 + 1e-9);
		}
	});
});

describe("labels", () => {
	it("puts a label outside the circle on the side its angle is on", () => {
		const right = labelOutside(Math.PI / 3);
		expect(right.anchor).toBe("start");
		expect(right.x).toBeCloseTo(215.5, 10);
		expect(right.y).toBeCloseTo(32.819, 3);
		const left = labelOutside((2 * Math.PI) / 3);
		expect(left.anchor).toBe("end");
		expect(left.x).toBeCloseTo(72.5, 10);
		expect(labelOutside(Math.PI / 2).anchor).toBe("start");
	});

	it("puts the axis label on the other side", () => {
		expect(labelAcrossAxisFrom(Math.PI / 3)).toEqual({ x: 138, y: 12, anchor: "end" });
		expect(labelAcrossAxisFrom(Math.PI / 2)).toEqual({ x: 138, y: 12, anchor: "end" });
		expect(labelAcrossAxisFrom(2)).toEqual({ x: 150, y: 12, anchor: "start" });
	});
});

describe("turnLabelPoint", () => {
	const turnOf = (size: number, iterations: number): [number, number] => [
		iterations === 0 ? 0 : stateAngle(size, 1, iterations - 1),
		stateAngle(size, 1, iterations),
	];

	it("sits on the bisector of a wide turn", () => {
		const label = turnLabelPoint(...turnOf(8, 1));
		expect(label.x).toBeCloseTo(191.25, 6);
		expect(label.y).toBeCloseTo(106.329, 3);
	});

	it("moves out along the bisector until both arrows are 10 away", () => {
		const label = turnLabelPoint(...turnOf(64, 1));
		expect(label.x).toBeCloseTo(221.5, 6);
		expect(label.y).toBeCloseTo(128.157, 3);
	});

	it("goes ahead of the arrow when the turn is too narrow and the arrow is still rising", () => {
		const first = turnLabelPoint(...turnOf(256, 0));
		expect(first.x).toBeCloseTo(205.455, 2);
		expect(first.y).toBeCloseTo(134.132, 2);
		const second = turnLabelPoint(...turnOf(256, 1));
		expect(second.x).toBeCloseTo(203.244, 2);
		expect(second.y).toBeCloseTo(126.573, 2);
	});

	it("goes behind the previous state once the arrow has passed the marked axis", () => {
		const label = turnLabelPoint(...turnOf(256, 13));
		expect(label.x).toBeCloseTo(154.452, 2);
		expect(label.y).toBeCloseTo(85.873, 2);
	});

	it("keeps 10 clear of both arrows and of the unmarked axis for every setting", () => {
		for (let qubits = 2; qubits <= 8; qubits++) {
			for (let marked = 1; marked <= mostMarked(qubits); marked++) {
				const size = 2 ** qubits;
				for (let iterations = 0; iterations <= lastIteration(size, marked); iterations++) {
					const to = stateAngle(size, marked, iterations);
					const from = iterations === 0 ? 0 : to - 2 * groverAngle(size, marked);
					const label = turnLabelPoint(from, to);
					const distance = Math.hypot(label.x - 144, 148 - label.y);
					const angle = Math.atan2(148 - label.y, label.x - 144);
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
