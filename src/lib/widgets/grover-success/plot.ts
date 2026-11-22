import { formatDyadic } from "../../quantum/format.ts";
import { bestIterations, successProbability } from "../../quantum/grover.ts";

export const plot = { width: 288, height: 190, left: 28, right: 12, top: 18, bottom: 34 } as const;

const innerWidth = plot.width - plot.left - plot.right;
const innerHeight = plot.height - plot.top - plot.bottom;
const fewestQueriesShown = 6;
const bestCountsShown = 3;
const mostTicks = 6;
const tickSteps = [1, 2, 5, 10, 20, 50] as const;

export interface Point {
	x: number;
	y: number;
}

export interface QueryPoint extends Point {
	queries: number;
	chance: number;
}

export interface Tick {
	value: number;
	label: string;
	at: number;
}

const clamp = (value: number, low: number, high: number): number =>
	Math.min(Math.max(value, low), high);

const rounded = (value: number): number => Number(value.toFixed(2));

/** At most a quarter of the inputs are marked, so that the best count is at least one iteration. */
export const mostMarked = (size: number): number => Math.max(1, Math.floor(size / 4));

export const clampMarked = (marked: number, size: number): number =>
	clamp(Math.round(marked), 1, mostMarked(size));

/** The right end of the horizontal axis: far enough past the best count for the curve to come back down. */
export const lastQuery = (size: number, marked: number): number =>
	Math.max(fewestQueriesShown, bestCountsShown * bestIterations(size, marked));

export const xOf = (queries: number, last: number): number =>
	rounded(plot.left + (innerWidth * queries) / last);

export const yOf = (chance: number): number => rounded(plot.top + innerHeight * (1 - chance));

/** No classical algorithm with t queries finds the one marked input with a better chance than this. */
export const classicalBound = (size: number, queries: number): number =>
	Math.min(1, (queries + 1) / size);

export const groverPoints = (size: number, marked: number, last: number): QueryPoint[] =>
	Array.from({ length: last + 1 }, (_, queries) => {
		const chance = successProbability(size, marked, queries);
		return { queries, chance, x: xOf(queries, last), y: yOf(chance) };
	});

export const linePath = (points: readonly Point[]): string =>
	points.map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x},${y}`).join("");

/**
 * The success probability between the whole numbers of queries too, as the curve sin²((2t + 1)θ).
 * Each query is cut into the same number of samples, so the curve passes through every dot.
 */
export function curvePath(size: number, marked: number, last: number): string {
	const samplesPerQuery = Math.ceil(innerWidth / last);
	const samples = Array.from({ length: last * samplesPerQuery + 1 }, (_, index) => {
		const queries = index / samplesPerQuery;
		return { x: xOf(queries, last), y: yOf(successProbability(size, marked, queries)) };
	});
	return linePath(samples);
}

export const areaPath = (curve: string, last: number): string =>
	`${curve}L${xOf(last, last)},${yOf(0)}L${xOf(0, last)},${yOf(0)}Z`;

/** The classical bound as a straight line that stops rising when it reaches certainty. */
export function classicalPath(size: number, last: number): string {
	const certain = size - 1;
	const corner = Math.min(last, certain);
	const rise = [0, corner].map((queries) => ({
		x: xOf(queries, last),
		y: yOf(classicalBound(size, queries)),
	}));
	return linePath(certain < last ? [...rise, { x: xOf(last, last), y: yOf(1) }] : rise);
}

/** The word "classical" sits just above the right end of the bound's line. */
export const classicalLabel = (size: number, last: number): Point => ({
	x: xOf(last, last),
	y: rounded(yOf(classicalBound(size, last)) - 5),
});

export const tickStep = (last: number): number =>
	tickSteps.find((step) => last / step <= mostTicks) ?? (tickSteps.at(-1) as number);

export function queryTicks(last: number): Tick[] {
	const step = tickStep(last);
	return Array.from({ length: Math.floor(last / step) + 1 }, (_, index) => {
		const value = index * step;
		return { value, label: String(value), at: xOf(value, last) };
	});
}

export const chanceTicks: readonly Tick[] = [0, 0.5, 1].map((value) => ({
	value,
	label: formatDyadic(value),
	at: yOf(value),
}));

/** Dots shrink as more of them share the axis, down to a size that still reads as a dot. */
export const dotRadius = (last: number): number =>
	rounded(clamp((0.3 * innerWidth) / last, 1.2, 3));

/** The whole number of queries nearest to a horizontal position in the picture's own units. */
export const queryAt = (x: number, last: number): number =>
	clamp(Math.round(((x - plot.left) / innerWidth) * last), 0, last);

/** The number of queries a key pressed on the plot moves to, if the key means anything there. */
export function keyedQuery(queries: number, key: string, last: number): number | undefined {
	const moved = (by: number): number => clamp(queries + by, 0, last);
	switch (key) {
		case "ArrowRight":
		case "ArrowUp":
			return moved(1);
		case "ArrowLeft":
		case "ArrowDown":
			return moved(-1);
		case "PageUp":
			return moved(tickStep(last));
		case "PageDown":
			return moved(-tickStep(last));
		case "Home":
			return 0;
		case "End":
			return last;
		default:
			return undefined;
	}
}

/** To three decimals, after rounding noise is removed so that 3/16 is 0.188 and not 0.187. */
export const formatChance = (chance: number): string => Number(chance.toFixed(10)).toFixed(3);

const countQueries = (queries: number): string =>
	`${queries} ${queries === 1 ? "query" : "queries"}`;

/** The highlighted values in one line; the classical bound holds only for a single marked input. */
export function describe(size: number, marked: number, queries: number): string {
	const search = marked === 1 ? `N = ${size}` : `N = ${size}, ${marked} marked`;
	const grover = `Grover ${formatChance(successProbability(size, marked, queries))}`;
	const classical =
		marked === 1 ? `, classical at most ${formatChance(classicalBound(size, queries))}` : "";
	return `${search}, ${countQueries(queries)}: ${grover}${classical}.`;
}

export const annotate = (size: number, marked: number, queries: number): string =>
	`t = ${queries}, P = ${formatChance(successProbability(size, marked, queries))}`;

export function describePicture(size: number, marked: number): string {
	const best = bestIterations(size, marked);
	const peak = formatChance(successProbability(size, marked, best));
	const last = lastQuery(size, marked);
	const inputs = marked === 1 ? "1 marked input" : `${marked} marked inputs`;
	const grover = `Grover's algorithm rises to ${peak} after ${countQueries(best)} and falls again`;
	const corner = Math.min(last, size - 1);
	const flat = corner < last ? " and stays there" : "";
	const classical =
		marked === 1
			? `; the classical bound rises in a straight line to ${formatChance(classicalBound(size, corner))} after ${countQueries(corner)}${flat}`
			: "";
	return `Probability of success against the number of queries, for N = ${size} with ${inputs}: ${grover}${classical}`;
}
