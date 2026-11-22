export const width = 288;
export const height = 186;
export const centre = { x: 144, y: 148 } as const;
export const radius = 120;

export interface Point {
	x: number;
	y: number;
}

export interface Square extends Point {
	side: number;
}

export interface Label extends Point {
	anchor: "start" | "end";
}

const rounded = (value: number): number => Math.round(value * 100) / 100;

/** The picture's point at an angle anticlockwise from the unmarked axis; the page's y runs down. */
export const pointAt = (angle: number, distance = radius): Point => ({
	x: centre.x + distance * Math.cos(angle),
	y: centre.y - distance * Math.sin(angle),
});

const isRightOfMarkedAxis = (angle: number): boolean => Math.cos(angle) >= -1e-12;

/** The path of the circular arc about the centre from one angle anticlockwise to a larger one. */
export function arcPath(from: number, to: number, distance: number): string {
	const start = pointAt(from, distance);
	const end = pointAt(to, distance);
	const large = to - from > Math.PI ? 1 : 0;
	return `M ${rounded(start.x)} ${rounded(start.y)} A ${distance} ${distance} 0 ${large} 0 ${rounded(end.x)} ${rounded(end.y)}`;
}

/** Where the shaft of the arrow stops, so that it does not show through the point of the head. */
export const arrowBase = (angle: number, length = 10): Point => pointAt(angle, radius - length);

/** The polygon points of an arrowhead whose point is on the circle at the given angle. */
export function arrowHead(angle: number, length = 10, halfWidth = 4.5): string {
	const tip = pointAt(angle);
	const base = arrowBase(angle, length);
	const across = { x: halfWidth * Math.sin(angle), y: halfWidth * Math.cos(angle) };
	return [
		tip,
		{ x: base.x + across.x, y: base.y + across.y },
		{ x: base.x - across.x, y: base.y - across.y },
	]
		.map(({ x, y }) => `${rounded(x)},${rounded(y)}`)
		.join(" ");
}

/** The square on the height of the arrow tip, drawn on the side of the tip that faces the marked axis. */
export function heightSquare(angle: number): Square {
	const tip = pointAt(angle);
	const side = Math.max(radius * Math.sin(angle), 0);
	return { x: isRightOfMarkedAxis(angle) ? tip.x - side : tip.x, y: tip.y, side };
}

/** A label just outside the circle, on the side of the marked axis that the angle is on. */
export function labelOutside(angle: number, distance = radius + 13, gap = 5): Label {
	const point = pointAt(angle, distance);
	return isRightOfMarkedAxis(angle)
		? { x: point.x + gap, y: point.y, anchor: "start" }
		: { x: point.x - gap, y: point.y, anchor: "end" };
}

/** The axis label takes the side of the marked axis that the label at the given angle leaves free. */
export const labelAcrossAxisFrom = (angle: number, gap = 6): Label =>
	isRightOfMarkedAxis(angle)
		? { x: centre.x - gap, y: 12, anchor: "end" }
		: { x: centre.x + gap, y: 12, anchor: "start" };

const turnLabelClearance = 10;
const nearestTurnLabel = 63;
const farthestTurnLabel = 96;

/**
 * Where the label of the turn between two states goes: between them, far enough out that both arrows
 * clear it, or, when the turn is too narrow for that, beside it on the side away from the marked axis,
 * which the height of the tip never crosses.
 */
export function turnLabelPoint(from: number, to: number): Point {
	const between = turnLabelClearance / Math.sin((to - from) / 2);
	if (between <= farthestTurnLabel) {
		return pointAt((from + to) / 2, Math.max(between, nearestTurnLabel));
	}
	const aside = Math.asin(turnLabelClearance / nearestTurnLabel);
	return pointAt(to < Math.PI / 2 ? to + aside : from - aside, nearestTurnLabel);
}
