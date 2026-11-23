import { formatSigned } from "../../quantum/format.ts";
import { invertAboutMean, mean, signOracle, uniformSuperposition } from "../../quantum/grover.ts";
import { type Amplitudes, hadamardOnEveryQubit, settled } from "../../quantum/state.ts";

/** The diffusion gate D = H^{⊗n} Z_0 H^{⊗n}, which reflects every amplitude across their average. */
export const diffuse = (state: Amplitudes): Amplitudes => settled(invertAboutMean(state));

/** H^{⊗n} applied to the state: its Fourier coefficients, each multiplied by √N. */
export const scaledFourierCoefficients = (state: Amplitudes): Amplitudes =>
	settled(hadamardOnEveryQubit(state));

/** The uniform superposition after one sign query of AND, which negates the all-ones input. */
export const afterQueryingAnd = (qubits: number): Amplitudes =>
	signOracle(uniformSuperposition(qubits), new Set([2 ** qubits - 1]));

const tolerance = 1e-9;

export const isSameState = (first: Amplitudes, second: Amplitudes): boolean =>
	first.length === second.length &&
	first.every((amplitude, index) => Math.abs(amplitude - (second[index] ?? 0)) < tolerance);

export const describeAverage = (state: Amplitudes): string =>
	`The average amplitude is ${formatSigned(mean(state))}.`;

export const averageLabel = (state: Amplitudes): string => `μ = ${formatSigned(mean(state))}`;

export const scaledAverageLabel = "√N·μ";

/** Where a bar of the given amplitude sits in a plot from +1 at its top to −1, in percent of its height. */
export function barBox(amplitude: number): { top: number; height: number } {
	const height = Math.min(Math.abs(amplitude), 1) * 50;
	return { top: amplitude < 0 ? 50 : 50 - height, height };
}
