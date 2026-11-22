import { expect, it, describe as suite } from "vitest";
import {
	annotate,
	areaPath,
	chanceTicks,
	clampMarked,
	classicalBound,
	classicalLabel,
	classicalPath,
	curvePath,
	describe,
	describePicture,
	dotRadius,
	groverPoints,
	keyedQuery,
	lastQuery,
	linePath,
	mostMarked,
	queryAt,
	queryTicks,
	tickStep,
	xOf,
	yOf,
} from "./plot";

suite("the search", () => {
	it("allows at most a quarter of the inputs to be marked", () => {
		expect(mostMarked(4)).toBe(1);
		expect(mostMarked(8)).toBe(2);
		expect(mostMarked(1024)).toBe(256);
		expect(clampMarked(5, 8)).toBe(2);
		expect(clampMarked(0, 8)).toBe(1);
		expect(clampMarked(3, 16)).toBe(3);
	});

	it("shows three times the best count, and at least six queries", () => {
		expect(lastQuery(4, 1)).toBe(6);
		expect(lastQuery(8, 1)).toBe(6);
		expect(lastQuery(16, 1)).toBe(9);
		expect(lastQuery(64, 1)).toBe(18);
		expect(lastQuery(1024, 1)).toBe(75);
		expect(lastQuery(1024, 256)).toBe(6);
	});

	it("bounds a classical search by (t + 1)/N, up to certainty", () => {
		expect(classicalBound(8, 0)).toBe(0.125);
		expect(classicalBound(8, 2)).toBe(0.375);
		expect(classicalBound(8, 7)).toBe(1);
		expect(classicalBound(4, 6)).toBe(1);
	});
});

suite("the scales", () => {
	it("put zero queries at the left edge and the last at the right", () => {
		expect(xOf(0, 6)).toBe(28);
		expect(xOf(3, 6)).toBe(152);
		expect(xOf(6, 6)).toBe(276);
		expect(xOf(25, 75)).toBe(110.67);
	});

	it("put certainty at the top and impossibility on the axis", () => {
		expect(yOf(1)).toBe(18);
		expect(yOf(0.5)).toBe(87);
		expect(yOf(0)).toBe(156);
	});

	it("find the nearest whole number of queries under a pointer", () => {
		expect(queryAt(28, 6)).toBe(0);
		expect(queryAt(90, 6)).toBe(2);
		expect(queryAt(131, 6)).toBe(2);
		expect(queryAt(132, 6)).toBe(3);
		expect(queryAt(0, 6)).toBe(0);
		expect(queryAt(288, 6)).toBe(6);
		expect(queryAt(110.67, 75)).toBe(25);
	});

	it("label a few round numbers of queries", () => {
		expect(tickStep(6)).toBe(1);
		expect(tickStep(9)).toBe(2);
		expect(tickStep(18)).toBe(5);
		expect(tickStep(75)).toBe(20);
		expect(queryTicks(9).map((tick) => tick.label)).toEqual(["0", "2", "4", "6", "8"]);
		expect(queryTicks(75).map((tick) => tick.value)).toEqual([0, 20, 40, 60]);
		expect(queryTicks(75).map((tick) => tick.at)).toEqual([28, 94.13, 160.27, 226.4]);
	});

	it("label the chances 0, 1/2 and 1", () => {
		expect(chanceTicks.map((tick) => tick.label)).toEqual(["0", "1/2", "1"]);
		expect(chanceTicks.map((tick) => tick.at)).toEqual([156, 87, 18]);
	});

	it("shrink the dots when there are many", () => {
		expect(dotRadius(6)).toBe(3);
		expect(dotRadius(30)).toBe(2.48);
		expect(dotRadius(75)).toBe(1.2);
	});
});

suite("the curves", () => {
	it("give Grover's chances for N = 8", () => {
		const points = groverPoints(8, 1, 6);
		expect(points).toHaveLength(7);
		expect(points.slice(0, 5).map((point) => point.chance.toFixed(3))).toEqual([
			"0.125",
			"0.781",
			"0.945",
			"0.330",
			"0.012",
		]);
		expect(points[0]).toMatchObject({ queries: 0, x: 28, y: 138.75 });
		expect(points[2]).toMatchObject({ queries: 2, x: 110.67, y: 25.55 });
	});

	it("reach the marked input exactly when N = 4", () => {
		expect(groverPoints(4, 1, 6)[1]?.chance).toBeCloseTo(1, 12);
		expect(groverPoints(8, 2, 6)[1]?.chance).toBeCloseTo(1, 12);
	});

	it("draw a line through points", () => {
		expect(
			linePath([
				{ x: 0, y: 1 },
				{ x: 2.5, y: 3 },
				{ x: 4, y: 0 },
			]),
		).toBe("M0,1L2.5,3L4,0");
	});

	it("draw the smooth curve through every dot", () => {
		const curve = curvePath(8, 1, 6);
		expect(curve.startsWith("M28,138.75L28.98,")).toBe(true);
		const end = groverPoints(8, 1, 6)[6];
		expect(end?.chance.toFixed(3)).toBe("1.000");
		expect(curve.endsWith(`L276,${end?.y}`)).toBe(true);
		expect(curve.split("L")).toHaveLength(253);
		for (const { x, y } of groverPoints(8, 1, 6).slice(1)) expect(curve).toContain(`L${x},${y}`);
		expect(curvePath(1024, 1, 75).split("L")).toHaveLength(301);
	});

	it("close the area under the curve along the axis", () => {
		expect(areaPath("M28,100L276,50", 6)).toBe("M28,100L276,50L276,156L28,156Z");
	});

	it("draw the classical bound as a line that flattens at certainty", () => {
		expect(classicalPath(8, 6)).toBe("M28,138.75L276,35.25");
		expect(classicalPath(4, 6)).toBe("M28,121.5L152,18L276,18");
		expect(classicalPath(1024, 75)).toBe("M28,155.87L276,145.76");
	});

	it("name the classical bound above the right end of its line", () => {
		expect(classicalLabel(8, 6)).toEqual({ x: 276, y: 30.25 });
		expect(classicalLabel(4, 6)).toEqual({ x: 276, y: 13 });
		expect(classicalLabel(1024, 75)).toEqual({ x: 276, y: 140.76 });
	});
});

suite("the keyboard", () => {
	it("moves one query at a time and stops at the ends", () => {
		expect(keyedQuery(2, "ArrowRight", 6)).toBe(3);
		expect(keyedQuery(2, "ArrowLeft", 6)).toBe(1);
		expect(keyedQuery(6, "ArrowUp", 6)).toBe(6);
		expect(keyedQuery(0, "ArrowDown", 6)).toBe(0);
	});

	it("jumps by a tick or to an end", () => {
		expect(keyedQuery(25, "PageUp", 75)).toBe(45);
		expect(keyedQuery(10, "PageDown", 75)).toBe(0);
		expect(keyedQuery(25, "Home", 75)).toBe(0);
		expect(keyedQuery(25, "End", 75)).toBe(75);
	});

	it("ignores other keys", () => {
		expect(keyedQuery(2, "a", 6)).toBeUndefined();
		expect(keyedQuery(2, "Tab", 6)).toBeUndefined();
	});
});

suite("the words", () => {
	it("state the highlighted values", () => {
		expect(describe(8, 1, 2)).toBe("N = 8, 2 queries: Grover 0.945, classical at most 0.375.");
		expect(describe(8, 1, 1)).toBe("N = 8, 1 query: Grover 0.781, classical at most 0.250.");
		expect(describe(8, 1, 4)).toBe("N = 8, 4 queries: Grover 0.012, classical at most 0.625.");
		expect(describe(4, 1, 1)).toBe("N = 4, 1 query: Grover 1.000, classical at most 0.500.");
		expect(describe(1024, 1, 25)).toBe(
			"N = 1024, 25 queries: Grover 0.999, classical at most 0.025.",
		);
	});

	it("leave the classical bound out when several inputs are marked", () => {
		expect(describe(8, 2, 1)).toBe("N = 8, 2 marked, 1 query: Grover 1.000.");
		expect(describe(16, 3, 0)).toBe("N = 16, 3 marked, 0 queries: Grover 0.188.");
	});

	it("annotate the figure with the chosen count and Grover's chance", () => {
		expect(annotate(8, 1, 2)).toBe("t = 2, P = 0.945");
		expect(annotate(8, 1, 0)).toBe("t = 0, P = 0.125");
		expect(annotate(4, 1, 1)).toBe("t = 1, P = 1.000");
		expect(annotate(16, 3, 0)).toBe("t = 0, P = 0.188");
		expect(annotate(1024, 1, 25)).toBe("t = 25, P = 0.999");
	});

	it("describe the picture", () => {
		expect(describePicture(8, 1)).toBe(
			"Probability of success against the number of queries, for N = 8 with 1 marked input: Grover's algorithm rises to 0.945 after 2 queries and falls again; the classical bound rises in a straight line to 0.875 after 6 queries",
		);
		expect(describePicture(4, 1)).toBe(
			"Probability of success against the number of queries, for N = 4 with 1 marked input: Grover's algorithm rises to 1.000 after 1 query and falls again; the classical bound rises in a straight line to 1.000 after 3 queries and stays there",
		);
		expect(describePicture(8, 2)).toBe(
			"Probability of success against the number of queries, for N = 8 with 2 marked inputs: Grover's algorithm rises to 1.000 after 1 query and falls again",
		);
	});
});
