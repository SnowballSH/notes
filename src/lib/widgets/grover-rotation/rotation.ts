import { bestIterations, groverAngle, successProbability } from "../../quantum/grover.ts";

const tolerance = 1e-9;

/** With more than a quarter of the inputs marked, one iteration already overshoots the marked axis. */
export const mostMarked = (qubits: number): number => 2 ** qubits / 4;

export const clampMarked = (marked: number, qubits: number): number =>
	Math.min(Math.max(marked, 1), mostMarked(qubits));

/** The angle of the state above the unmarked axis after the given number of iterations. */
export const stateAngle = (size: number, marked: number, iterations: number): number =>
	(2 * iterations + 1) * groverAngle(size, marked);

/** The last iteration whose state is still in the upper half of the circle, which is all the picture draws. */
export const lastIteration = (size: number, marked: number): number =>
	Math.floor((Math.PI / groverAngle(size, marked) - 1) / 2);

export const angleMultiple = (iterations: number): string =>
	iterations === 0 ? "θ" : `${2 * iterations + 1}θ`;

export const turnLabel = (iterations: number): string => (iterations === 0 ? "θ" : "2θ");

export function formatProbability(probability: number): string {
	const whole = Math.round(probability);
	return Math.abs(probability - whole) < tolerance ? String(whole) : probability.toFixed(3);
}

export const caption = (qubits: number, marked: number, iterations: number): string =>
	`t = ${iterations}, P = ${formatProbability(successProbability(2 ** qubits, marked, iterations))}`;

export function describe(qubits: number, marked: number, iterations: number): string {
	const size = 2 ** qubits;
	const angle = stateAngle(size, marked, iterations).toFixed(2);
	const probability = formatProbability(successProbability(size, marked, iterations));
	return `t = ${iterations} of T = ${bestIterations(size, marked)}: angle ${angleMultiple(iterations)} ≈ ${angle}, probability ${probability}.`;
}

export function describePicture(qubits: number, marked: number, iterations: number): string {
	const size = 2 ** qubits;
	const height = Math.sin(stateAngle(size, marked, iterations)).toFixed(2);
	const probability = formatProbability(successProbability(size, marked, iterations));
	return `Upper half of the unit circle, with the unmarked inputs along the horizontal axis and the marked inputs along the vertical axis. The state after ${iterations} iterations is the arrow at angle ${angleMultiple(iterations)}, of height ${height}; the square on that height has area ${probability}, the probability of a marked input. The best count T = ${bestIterations(size, marked)} is ticked on the circle.`;
}
