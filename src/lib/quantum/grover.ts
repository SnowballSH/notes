import type { Amplitudes } from "./state.ts";

export const mean = (state: Amplitudes): number =>
	state.reduce((sum, amplitude) => sum + amplitude, 0) / state.length;

/** The oracle that answers in the sign: the amplitudes of the marked inputs are negated. */
export const signOracle = (state: Amplitudes, marked: ReadonlySet<number>): Amplitudes =>
	state.map((amplitude, index) => (marked.has(index) ? -amplitude : amplitude));

/** Reflects every amplitude through the mean of them all, which is Grover's diffusion step. */
export function invertAboutMean(state: Amplitudes): Amplitudes {
	const centre = mean(state);
	return state.map((amplitude) => 2 * centre - amplitude);
}

export const uniformSuperposition = (qubits: number): Amplitudes =>
	Array.from({ length: 2 ** qubits }, () => 2 ** (-qubits / 2));

export const groverIteration = (state: Amplitudes, marked: ReadonlySet<number>): Amplitudes =>
	invertAboutMean(signOracle(state, marked));

/** The angle between the uniform superposition and the unmarked inputs; an iteration turns by twice it. */
export const groverAngle = (size: number, markedCount: number): number =>
	Math.asin(Math.sqrt(markedCount / size));

/** The chance that measuring after the given number of iterations gives a marked input. */
export const successProbability = (size: number, markedCount: number, iterations: number): number =>
	Math.sin((2 * iterations + 1) * groverAngle(size, markedCount)) ** 2;

/** The number of iterations after which the state is closest to the marked inputs. */
export const bestIterations = (size: number, markedCount: number): number =>
	Math.floor(Math.PI / (4 * groverAngle(size, markedCount)));
