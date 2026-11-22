/**
 * The roadmap is a grid with a flow axis, along which sections follow one another (down a
 * narrow note, across a wide one), and a cross axis that holds the main chain, the side
 * branch and a rail for the arrow that skips layers. Everything here is in grid lines, so
 * the stylesheet can turn the same layout either way.
 */
export type Lane = "main" | "branch";

export interface Placement {
	/** Counted from 1 along the flow axis. */
	layer: number;
	lane: Lane;
}

/** Grid lines: the tracks from `start` up to, not including, `end`. */
export interface Span {
	start: number;
	end: number;
}

export interface Cell {
	flow: Span;
	cross: Span;
}

export type ConnectorShape =
	| "step"
	| "branch-start"
	| "branch-end"
	| "skip-start"
	| "skip-rail"
	| "skip-end";

export interface Connector extends Cell {
	shape: ConnectorShape;
	from: string;
	to: string;
}

export const placements: Readonly<Record<string, Placement>> = {
	"2.1": { layer: 1, lane: "main" },
	"2.2": { layer: 2, lane: "main" },
	"3.1": { layer: 3, lane: "main" },
	"2.3": { layer: 3, lane: "branch" },
	"3.2": { layer: 4, lane: "main" },
	"2.4": { layer: 4, lane: "branch" },
	"4.1": { layer: 5, lane: "main" },
};

const track = (start: number, tracks = 1): Span => ({ start, end: start + tracks });

const laneTrack: Readonly<Record<Lane, number>> = { main: 1, branch: 3 };
const crossGapTrack = 2;
const railTrack = 4;

const layerTrack = (layer: number): number => 2 * layer - 1;
const gapTrackAfter = (layer: number): number => 2 * layer;

export const layerCount = (places: Readonly<Record<string, Placement>>): number =>
	Math.max(...Object.values(places).map(({ layer }) => layer));

export const boxCell = ({ layer, lane }: Placement): Cell => ({
	flow: track(layerTrack(layer)),
	cross: track(laneTrack[lane]),
});

/** A span as the value of `grid-row` or `grid-column`. */
export const gridLines = ({ start, end }: Span): string => `${start} / ${end}`;

function pieces(from: Placement, to: Placement): (Cell & { shape: ConnectorShape })[] {
	const layers = to.layer - from.layer;
	if (from.lane === to.lane && layers === 1) {
		return [
			{ shape: "step", flow: track(gapTrackAfter(from.layer)), cross: track(laneTrack[to.lane]) },
		];
	}
	if (from.lane !== "main" || to.lane !== "branch" || layers < 1) {
		throw new Error(
			`the roadmap cannot draw an arrow from layer ${from.layer} of the ${from.lane} lane to layer ${to.layer} of the ${to.lane} lane`,
		);
	}
	if (layers === 1) {
		const flow = track(gapTrackAfter(from.layer));
		return [
			{ shape: "branch-start", flow, cross: track(laneTrack.main) },
			{ shape: "branch-end", flow, cross: track(laneTrack.branch) },
		];
	}
	const between = gapTrackAfter(from.layer);
	return [
		{
			shape: "skip-start",
			flow: track(layerTrack(from.layer)),
			cross: { start: crossGapTrack, end: railTrack + 1 },
		},
		{
			shape: "skip-rail",
			flow: { start: between, end: layerTrack(to.layer) },
			cross: track(railTrack),
		},
		{ shape: "skip-end", flow: track(layerTrack(to.layer)), cross: track(railTrack) },
	];
}

export function placeOf(
	number: string,
	places: Readonly<Record<string, Placement>> = placements,
): Placement {
	const place = places[number];
	if (place === undefined) throw new Error(`section ${number} has no place in the roadmap`);
	return place;
}

/** The pieces of every arrow, each in the grid cell it is drawn in. */
export const connectors = (
	needs: Readonly<Record<string, readonly string[]>>,
	places: Readonly<Record<string, Placement>> = placements,
): Connector[] =>
	Object.entries(needs).flatMap(([to, froms]) =>
		froms.flatMap((from) =>
			pieces(placeOf(from, places), placeOf(to, places)).map((piece) => ({ ...piece, from, to })),
		),
	);
