import { describe, expect, it } from "vitest";
import { dependencies, destination } from "./dependencies";
import {
	boxCell,
	type Cell,
	connectors,
	gridLines,
	layerCount,
	placements,
	placeOf,
	type Span,
} from "./layout";

const drawn = connectors(dependencies, placements);
const brief = ({ flow, cross }: Cell): string => `${gridLines(flow)} | ${gridLines(cross)}`;
const meet = (first: Span, second: Span): boolean =>
	first.start < second.end && second.start < first.end;
const overlap = (first: Cell, second: Cell): boolean =>
	meet(first.flow, second.flow) && meet(first.cross, second.cross);

describe("the layout of the roadmap", () => {
	it("places exactly the sections that have dependencies", () => {
		expect(Object.keys(placements).toSorted()).toEqual(Object.keys(dependencies).toSorted());
	});

	it("puts the main chain in one lane, a layer apart, ending at the destination", () => {
		const main = Object.entries(placements)
			.filter(([, { lane }]) => lane === "main")
			.toSorted(([, first], [, second]) => first.layer - second.layer);
		expect(main.map(([number]) => number)).toEqual(["2.1", "2.2", "3.1", "3.2", "4.1"]);
		expect(main.map(([, { layer }]) => layer)).toEqual([1, 2, 3, 4, 5]);
		expect(main.at(-1)?.[0]).toBe(destination);
		expect(layerCount(placements)).toBe(5);
	});

	it("gives each box a track of its own between the gap tracks", () => {
		const cells = Object.fromEntries(
			Object.entries(placements).map(([number, place]) => [number, brief(boxCell(place))]),
		);
		expect(cells).toEqual({
			"2.1": "1 / 2 | 1 / 2",
			"2.2": "3 / 4 | 1 / 2",
			"3.1": "5 / 6 | 1 / 2",
			"2.3": "5 / 6 | 3 / 4",
			"3.2": "7 / 8 | 1 / 2",
			"4.1": "9 / 10 | 1 / 2",
		});
	});

	it("draws every dependency", () => {
		expect(
			drawn.map((piece) => `${piece.from}>${piece.to} ${piece.shape} ${brief(piece)}`),
		).toEqual([
			"2.1>2.2 step 2 / 3 | 1 / 2",
			"2.2>2.3 branch-start 4 / 5 | 1 / 2",
			"2.2>2.3 branch-end 4 / 5 | 3 / 4",
			"2.2>3.1 step 4 / 5 | 1 / 2",
			"3.1>3.2 step 6 / 7 | 1 / 2",
			"3.2>4.1 step 8 / 9 | 1 / 2",
		]);
	});

	it("draws an arrow that skips layers around the outside", () => {
		const places = { ...placements, "9.9": { layer: 4, lane: "branch" } } as const;
		const skipping = connectors({ "9.9": ["2.1", "2.3"] }, places);
		expect(
			skipping.map((piece) => `${piece.from}>${piece.to} ${piece.shape} ${brief(piece)}`),
		).toEqual([
			"2.1>9.9 skip-start 1 / 2 | 2 / 5",
			"2.1>9.9 skip-rail 2 / 7 | 4 / 5",
			"2.1>9.9 skip-end 7 / 8 | 4 / 5",
			"2.3>9.9 step 6 / 7 | 3 / 4",
		]);
	});

	it("never draws an arrow across a box", () => {
		const crossed = drawn.flatMap((piece) =>
			Object.entries(placements)
				.filter(([, place]) => overlap(piece, boxCell(place)))
				.map(([number]) => `${piece.from}>${piece.to} over ${number}`),
		);
		expect(crossed).toEqual([]);
	});

	it("refuses an arrow it has no shape for", () => {
		expect(() => connectors({ "2.1": ["2.3"] }, placements)).toThrow(
			"the roadmap cannot draw an arrow from layer 3 of the branch lane to layer 1 of the main lane",
		);
		expect(placeOf("2.3")).toEqual({ layer: 3, lane: "branch" });
		expect(() => connectors({ "2.1": ["9.9"] }, placements)).toThrow(
			"section 9.9 has no place in the roadmap",
		);
	});
});
