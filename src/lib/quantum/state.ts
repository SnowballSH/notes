/** The amplitudes of a state of n qubits, indexed by the 2^n bitstrings read as binary numbers. */
export type Amplitudes = readonly number[];

export const qubitCount = (state: Amplitudes): number => Math.round(Math.log2(state.length));

export function basisState(qubits: number, index: number): Amplitudes {
	const size = 2 ** qubits;
	if (!Number.isInteger(index) || index < 0 || index >= size)
		throw new RangeError(`${qubits} qubits have no basis state ${index}`);
	return Array.from({ length: size }, (_, entry) => (entry === index ? 1 : 0));
}

/** Applies the Hadamard gate to every qubit, one qubit at a time as the fast transform does. */
export function hadamardOnEveryQubit(state: Amplitudes): Amplitudes {
	const next = [...state];
	for (let half = 1; half < next.length; half *= 2) {
		for (let block = 0; block < next.length; block += 2 * half) {
			for (let low = block; low < block + half; low++) {
				const upper = next[low] ?? 0;
				const lower = next[low + half] ?? 0;
				next[low] = (upper + lower) * Math.SQRT1_2;
				next[low + half] = (upper - lower) * Math.SQRT1_2;
			}
		}
	}
	return next;
}

const roundingTrace = 1e-12;

/** Amplitudes that cancelled leave a trace of rounding behind; this makes them exactly zero. */
export const settled = (state: Amplitudes): Amplitudes =>
	state.map((amplitude) => (Math.abs(amplitude) < roundingTrace ? 0 : amplitude));

export const probabilities = (state: Amplitudes): number[] =>
	state.map((amplitude) => amplitude ** 2);

export const bitstring = (index: number, qubits: number): string =>
	index.toString(2).padStart(qubits, "0");
