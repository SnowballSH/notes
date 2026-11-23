import { formatAmplitude, ket, minusSign } from "../../quantum/format.ts";
import { type Amplitudes, settled } from "../../quantum/state.ts";

// The state is a whole number of steps round the circle, so that repeated H never drifts.
export const stepsPerTurn = 48;
const stepAngle = (2 * Math.PI) / stepsPerTurn;
const quarterTurn = stepsPerTurn / 4;
const eighthTurn = stepsPerTurn / 8;

export const degreesPerStep = 360 / stepsPerTurn;

export const wrapStep = (step: number): number =>
	((step % stepsPerTurn) + stepsPerTurn) % stepsPerTurn;

export const angleOf = (step: number): number => step * stepAngle;

export const stateAt = (step: number): Amplitudes =>
	settled([Math.cos(angleOf(step)), Math.sin(angleOf(step))]);

export const reflectStep = (step: number): number => wrapStep(eighthTurn - step);

export const mirrorAngle = Math.PI / 8;

export const namedStates = [
	{ name: ket("0"), step: 0 },
	{ name: ket("+"), step: eighthTurn },
	{ name: ket("1"), step: quarterTurn },
	{ name: ket(minusSign), step: stepsPerTurn - eighthTurn },
] as const;

export const nearestStep = (across: number, up: number): number =>
	wrapStep(Math.round(Math.atan2(up, across) / stepAngle));

export function keyedStep(step: number, key: string): number | undefined {
	switch (key) {
		case "ArrowUp":
		case "ArrowRight":
			return wrapStep(step + 1);
		case "ArrowDown":
		case "ArrowLeft":
			return wrapStep(step - 1);
		case "PageUp":
			return wrapStep(step + eighthTurn);
		case "PageDown":
			return wrapStep(step - eighthTurn);
		case "Home":
			return 0;
		case "End":
			return stepsPerTurn - 1;
		default:
			return undefined;
	}
}

export const describeState = (state: Amplitudes): string =>
	`α = ${formatAmplitude(state[0] ?? 0)}, β = ${formatAmplitude(state[1] ?? 0)}`;
