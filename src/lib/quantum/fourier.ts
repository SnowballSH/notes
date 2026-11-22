const isPowerOfTwo = (length: number): boolean =>
	Number.isInteger(Math.log2(length)) && length >= 1;

/**
 * The unnormalised Walsh-Hadamard matrix times a vector whose length is a power of two:
 * entry s of the result is the sum over x of (-1)^(s·x) values[x]. Exact on integers.
 */
export function walshHadamard(values: readonly number[]): number[] {
	if (!isPowerOfTwo(values.length))
		throw new RangeError(`a vector of length ${values.length} has no Walsh-Hadamard transform`);
	const next = [...values];
	for (let half = 1; half < next.length; half *= 2) {
		for (let block = 0; block < next.length; block += 2 * half) {
			for (let low = block; low < block + half; low++) {
				const upper = next[low] ?? 0;
				const lower = next[low + half] ?? 0;
				next[low] = upper + lower;
				next[low + half] = upper - lower;
			}
		}
	}
	return next;
}

/** The Fourier coefficients of a function on bitstrings, given as its table of values. */
export const fourierCoefficients = (values: readonly number[]): number[] =>
	walshHadamard(values).map((sum) => sum / values.length);
