import { describe, expect, it } from "vitest";
import { kinds } from "./circuit";
import {
	type Box,
	circuitDiagram,
	type Diagram,
	diffusionDiagram,
	ellipsisDotRadius,
	ellipsisPitch,
	ellipsisRow,
	labelAnchors,
	labelWidth,
	leadWidth,
	meterHeight,
	scriptFontSize,
	subBaseline,
	supBaseline,
	width,
	wireRows,
} from "./layout";

const diagrams: readonly (readonly [string, Diagram])[] = [
	...kinds.map((kind) => [kind, circuitDiagram(kind)] as const),
	["diffusion", diffusionDiagram],
];

const clearance = 8;
const right = (box: Box): number => box.x + box.width;
const bottom = (box: Box): number => box.y + box.height;
const boxesOf = (diagram: Diagram): Box[] => [...diagram.gates, ...diagram.meters];
const overlap = (first: Box, second: Box): boolean =>
	first.x < right(second) + clearance &&
	second.x < right(first) + clearance &&
	first.y < bottom(second) &&
	second.y < bottom(first);

describe("the layout of the circuit diagrams", () => {
	it("places the gates of Fourier sampling, the query second", () => {
		const { gates, meters, height } = circuitDiagram("fourier-sampling");
		expect(gates.map(({ x, width: gateWidth }) => [x, x + gateWidth])).toEqual([
			[38, 86],
			[102, 150],
			[166, 214],
		]);
		expect(gates.map((gate) => gate.query)).toEqual([false, true, false]);
		expect(meters.map(({ x, y }) => [x, y])).toEqual([
			[234, 12],
			[234, 40],
			[234, 88],
		]);
		expect(height).toBe(120);
	});

	it("brackets the oracle and D of Grover's algorithm, and nothing else", () => {
		const { gates, meters, repeat, height } = circuitDiagram("grover");
		expect(gates.map(({ x, width: gateWidth }) => [x, x + gateWidth])).toEqual([
			[38, 86],
			[110, 158],
			[170, 206],
		]);
		expect(gates.map((gate) => gate.query)).toEqual([false, true, false]);
		expect(repeat).toEqual({
			x1: 104,
			x2: 212,
			y: 118,
			depth: 6,
			label: "× T",
			labelX: 158,
			labelY: 138,
		});
		expect(repeat?.x1).toBeGreaterThan(right(gates[0] as Box) + clearance);
		expect(repeat?.x2).toBeLessThan((meters[0] as Box).x - clearance);
		expect(height).toBe(146);
	});

	it("writes D as three gates with no measurement", () => {
		expect(diffusionDiagram.gates.map(({ x, label }) => [x, label.base])).toEqual([
			[46, "H"],
			[132, "Z"],
			[218, "H"],
		]);
		expect(diffusionDiagram.meters).toEqual([]);
		expect(diffusionDiagram.ellipsisColumns).toEqual([113, 199]);
		expect(diffusionDiagram.leads).toEqual([{ text: "D =", y: 60 }]);
		expect(diffusionDiagram.height).toBe(120);
	});

	it.each(diagrams)("keeps the boxes of %s apart", (_, diagram) => {
		const boxes = boxesOf(diagram);
		const touching = boxes.flatMap((first, index) =>
			boxes.slice(index + 1).filter((second) => overlap(first, second)),
		);
		expect(touching).toEqual([]);
	});

	it.each(diagrams)("keeps everything of %s inside the picture", (_, diagram) => {
		for (const box of boxesOf(diagram)) {
			expect(box.x).toBeGreaterThanOrEqual(diagram.wire.x1 + clearance);
			expect(right(box)).toBeLessThanOrEqual(diagram.wire.x2 - clearance);
			expect(box.y).toBeGreaterThanOrEqual(1);
			expect(bottom(box)).toBeLessThanOrEqual(diagram.height - 1);
		}
		expect(diagram.wire.x2).toBeLessThanOrEqual(width - 1);
		for (const lead of diagram.leads) {
			expect(diagram.leadX - leadWidth(lead) / 2).toBeGreaterThanOrEqual(0);
			expect(diagram.leadX + leadWidth(lead) / 2).toBeLessThan(diagram.wire.x1);
		}
		if (diagram.repeat) expect(diagram.repeat.labelY).toBeLessThan(diagram.height - 1);
	});

	it.each(diagrams)("fits the name of every gate of %s inside its box", (_, diagram) => {
		for (const gate of diagram.gates) {
			const { base, script } = labelAnchors(gate);
			expect(base).toBeGreaterThanOrEqual(gate.x + 4);
			expect(base + labelWidth(gate.label)).toBeLessThanOrEqual(right(gate) - 4);
			expect(script).toBeGreaterThan(base);
		}
	});

	it("centres a letter with its scripts", () => {
		const [hadamard, oracle, d] = circuitDiagram("grover").gates;
		expect(labelWidth((hadamard as Diagram["gates"][number]).label)).toBeCloseTo(22.1);
		expect(labelAnchors(hadamard as Diagram["gates"][number]).base).toBeCloseTo(50.95);
		expect(labelAnchors(hadamard as Diagram["gates"][number]).script).toBeCloseTo(59.85);
		expect(labelWidth((oracle as Diagram["gates"][number]).label)).toBeCloseTo(15.5);
		expect(labelAnchors(d as Diagram["gates"][number]).base).toBeCloseTo(183.8);
		expect(subBaseline - supBaseline).toBe(12);
		expect(scriptFontSize).toBe(11);
	});

	it.each(diagrams)("marks the wires of %s as n qubits, clear of every box", (_, diagram) => {
		expect(diagram.ellipsisColumns).toHaveLength(2);
		const reach = ellipsisDotRadius + 2;
		const dots: Box = {
			x: 0,
			y: ellipsisRow - ellipsisPitch - reach,
			width: 0,
			height: 2 * (ellipsisPitch + reach),
		};
		for (const column of diagram.ellipsisColumns) {
			const covering = boxesOf(diagram).filter(
				(box) =>
					column + reach > box.x &&
					column - reach < right(box) &&
					dots.y < bottom(box) &&
					bottom(dots) > box.y,
			);
			expect(covering).toEqual([]);
			expect(column - reach).toBeGreaterThanOrEqual(0);
			expect(column + reach).toBeLessThanOrEqual(width);
		}
	});

	it("leaves room for the ellipsis between the second and third wires", () => {
		expect(wireRows).toEqual([22, 50, 98]);
		expect(ellipsisRow - ellipsisPitch).toBeGreaterThan(wireRows[1] + meterHeight / 2);
		expect(ellipsisRow + ellipsisPitch).toBeLessThan(wireRows[2] - meterHeight / 2);
	});
});
