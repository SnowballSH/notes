import { formatSigned } from "../../quantum/format.ts";
import { invertAboutMean, mean, signOracle, uniformSuperposition } from "../../quantum/grover.ts";
import { type Amplitudes, hadamardOnEveryQubit, settled } from "../../quantum/state.ts";

export const diffuse = (state: Amplitudes): Amplitudes => settled(invertAboutMean(state));

export const scaledFourierCoefficients = (state: Amplitudes): Amplitudes =>
	settled(hadamardOnEveryQubit(state));

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

export function barBox(amplitude: number): { top: number; height: number } {
	const height = Math.min(Math.abs(amplitude), 1) * 50;
	return { top: amplitude < 0 ? 50 : 50 - height, height };
}
