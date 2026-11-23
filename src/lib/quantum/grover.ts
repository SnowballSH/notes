import type { Amplitudes } from "./state.ts";

export const mean = (state: Amplitudes): number =>
	state.reduce((sum, amplitude) => sum + amplitude, 0) / state.length;

export const signOracle = (state: Amplitudes, marked: ReadonlySet<number>): Amplitudes =>
	state.map((amplitude, index) => (marked.has(index) ? -amplitude : amplitude));

export function invertAboutMean(state: Amplitudes): Amplitudes {
	const centre = mean(state);
	return state.map((amplitude) => 2 * centre - amplitude);
}

export const uniformSuperposition = (qubits: number): Amplitudes =>
	Array.from({ length: 2 ** qubits }, () => 2 ** (-qubits / 2));

export const groverIteration = (state: Amplitudes, marked: ReadonlySet<number>): Amplitudes =>
	invertAboutMean(signOracle(state, marked));

export const groverAngle = (size: number, markedCount: number): number =>
	Math.asin(Math.sqrt(markedCount / size));

export const successProbability = (size: number, markedCount: number, iterations: number): number =>
	Math.sin((2 * iterations + 1) * groverAngle(size, markedCount)) ** 2;

export const bestIterations = (size: number, markedCount: number): number =>
	Math.floor(Math.PI / (4 * groverAngle(size, markedCount)));
