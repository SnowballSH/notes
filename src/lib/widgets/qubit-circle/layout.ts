import type { Amplitudes } from "../../quantum/state.ts";

export const size = 288;
export const centre = size / 2;
export const radius = 96;

export interface Point {
	x: number;
	y: number;
}

export const pointOf = (state: Amplitudes, scale = radius): Point => ({
	x: centre + scale * (state[0] ?? 0),
	y: centre - scale * (state[1] ?? 0),
});

export const pointAtAngle = (angle: number, distance: number): Point =>
	pointOf([Math.cos(angle), Math.sin(angle)], distance);

export type Anchor = "start" | "middle" | "end";

export function anchorAt(angle: number): Anchor {
	const across = Math.cos(angle);
	if (across > 0.3) return "start";
	return across < -0.3 ? "end" : "middle";
}
