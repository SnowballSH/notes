import { walshHadamard } from "./fourier.ts";

export type Amplitudes = readonly number[];

export const qubitCount = (state: Amplitudes): number => Math.round(Math.log2(state.length));

export function basisState(qubits: number, index: number): Amplitudes {
	const size = 2 ** qubits;
	if (!Number.isInteger(index) || index < 0 || index >= size)
		throw new RangeError(`${qubits} qubits have no basis state ${index}`);
	return Array.from({ length: size }, (_, entry) => (entry === index ? 1 : 0));
}

export const hadamardOnEveryQubit = (state: Amplitudes): Amplitudes =>
	walshHadamard(state).map((sum) => sum / Math.sqrt(state.length));

const roundingTrace = 1e-12;

export const settled = (state: Amplitudes): Amplitudes =>
	state.map((amplitude) => (Math.abs(amplitude) < roundingTrace ? 0 : amplitude));

export const probabilities = (state: Amplitudes): number[] =>
	state.map((amplitude) => amplitude ** 2);

export const bitstring = (index: number, qubits: number): string =>
	index.toString(2).padStart(qubits, "0");

export const bitstrings = (qubits: number): string[] =>
	Array.from({ length: 2 ** qubits }, (_, index) => bitstring(index, qubits));
