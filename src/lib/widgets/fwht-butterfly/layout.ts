import { clamp } from "../../quantum/numbers.ts";

/** The diagram in SVG units; at a note 288px wide one unit is one pixel. */
export const width = 288;
export const nodeWidth = 36;
export const nodeHeight = 24;
/** Also the height of the pointer target of an entry: 2.75rem when one unit is one pixel. */
export const rowPitch = 44;
export const reachWidth = 44;
const headingHeight = 20;
const sideMargin = 3;

export const heightFor = (rows: number): number => headingHeight + rows * rowPitch;
export const headingBaseline = 12;

export const columnCentre = (level: number, lastLevel: number): number =>
	sideMargin + nodeWidth / 2 + (level * (width - 2 * sideMargin - nodeWidth)) / lastLevel;

export const rowCentre = (index: number): number => headingHeight + (index + 0.5) * rowPitch;

export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** The pointer target of an entry: wider than the node, shifted inwards at the outer columns. */
export function reachBox(level: number, index: number, lastLevel: number): Box {
	const left = columnCentre(level, lastLevel) - reachWidth / 2;
	return {
		x: clamp(left, 0, width - reachWidth),
		y: rowCentre(index) - rowPitch / 2,
		width: reachWidth,
		height: rowPitch,
	};
}

export interface Heading {
	x: number;
	anchor: "start" | "middle" | "end";
}

/** The outer headings are set flush with their nodes so that neither leaves the picture. */
export function headingAt(level: number, lastLevel: number): Heading {
	const centre = columnCentre(level, lastLevel);
	if (level === 0) return { x: centre - nodeWidth / 2, anchor: "start" };
	if (level === lastLevel) return { x: centre + nodeWidth / 2, anchor: "end" };
	return { x: centre, anchor: "middle" };
}

export interface Segment {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/** The line from the right edge of an entry to the left edge of an entry of the next level. */
export const wireSegment = (
	level: number,
	from: number,
	to: number,
	lastLevel: number,
): Segment => ({
	x1: columnCentre(level - 1, lastLevel) + nodeWidth / 2,
	y1: rowCentre(from),
	x2: columnCentre(level, lastLevel) - nodeWidth / 2,
	y2: rowCentre(to),
});
