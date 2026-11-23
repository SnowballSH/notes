import { clamp } from "../../quantum/numbers.ts";

export const width = 328;
export const centre = { x: 132, y: 148 } as const;
export const radius = 120;
export const axisOverhang = 6;

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

const labelGap = 14;
const labelBand = 26;
// Half the width of "P = 0.125" in a monospace font, in units of its font size.
const chanceHalfWidth = 2.7;

export const textSize = (shownWidth: number, pixels = 12): number =>
	shownWidth > 0 ? rounded((pixels * width) / shownWidth) : pixels;

export const dipBelowAxis = (angle: number): number => Math.max(0, -radius * Math.sin(angle));

export const pictureHeight = (deepest: number): number =>
	Math.ceil(centre.y + dipBelowAxis(deepest) + labelBand);

export const unmarkedLabel: Label = {
	x: centre.x + radius + axisOverhang + 4,
	y: centre.y,
	anchor: "start",
};

export const pointAt = (angle: number, distance = radius): Point => ({
	x: centre.x + distance * Math.cos(angle),
	y: centre.y - distance * Math.sin(angle),
});

const isRightOfMarkedAxis = (angle: number): boolean => Math.cos(angle) >= -1e-12;

export function arcPath(from: number, to: number, distance: number): string {
	const start = pointAt(from, distance);
	const end = pointAt(to, distance);
	const large = to - from > Math.PI ? 1 : 0;
	return `M ${rounded(start.x)} ${rounded(start.y)} A ${distance} ${distance} 0 ${large} 0 ${rounded(end.x)} ${rounded(end.y)}`;
}

// The shaft stops at the base of the head so that it does not show through its point.
export const arrowBase = (angle: number, length = 10): Point => pointAt(angle, radius - length);

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

export function heightSquare(angle: number): Square {
	const tip = pointAt(angle);
	const side = radius * Math.abs(Math.sin(angle));
	return {
		x: isRightOfMarkedAxis(angle) ? tip.x - side : tip.x,
		y: Math.min(tip.y, centre.y),
		side,
	};
}

export function chanceLabelPoint(square: Square, size: number): Point {
	const reach = radius - chanceHalfWidth * size;
	return {
		x: clamp(square.x + square.side / 2, centre.x - reach, centre.x + reach),
		y: square.y + square.side + labelGap,
	};
}

export function labelOutside(angle: number, distance = radius + 13, gap = 5): Label {
	const point = pointAt(angle, distance);
	return isRightOfMarkedAxis(angle)
		? { x: point.x + gap, y: point.y, anchor: "start" }
		: { x: point.x - gap, y: point.y, anchor: "end" };
}

export const labelAcrossAxisFrom = (angle: number, gap = 6): Label =>
	isRightOfMarkedAxis(angle)
		? { x: centre.x - gap, y: 12, anchor: "end" }
		: { x: centre.x + gap, y: 12, anchor: "start" };

const turnLabelClearance = 10;
const nearestTurnLabel = 63;
const farthestTurnLabel = 96;

// Between the two arrows when it fits there above the unmarked axis, else beside the turn, away from the marked axis.
export function turnLabelPoint(from: number, to: number): Point {
	const between = turnLabelClearance / Math.sin((to - from) / 2);
	const middle = pointAt((from + to) / 2, Math.max(between, nearestTurnLabel));
	if (between <= farthestTurnLabel && centre.y - middle.y >= turnLabelClearance - 1e-9) {
		return middle;
	}
	const aside = Math.asin(turnLabelClearance / nearestTurnLabel);
	return pointAt(to < Math.PI / 2 ? to + aside : from - aside, nearestTurnLabel);
}
