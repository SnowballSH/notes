import { describe, expect, it } from "vitest";
import { hadamardSign } from "../widgets/hadamard-tiling/matrix";
import { formatAmplitude } from "./format";
import {
	basisState,
	bitstring,
	bitstrings,
	hadamardOnEveryQubit,
	probabilities,
	qubitCount,
	settled,
} from "./state";

const sum = (values: readonly number[]): number =>
	values.reduce((total, value) => total + value, 0);

/** Built from the recursive definition: H_1 = [1] and H_2N = [[H_N, H_N], [H_N, -H_N]]. */
function walshHadamard(level: number): number[][] {
	if (level === 0) return [[1]];
	const smaller = walshHadamard(level - 1);
	return [
		...smaller.map((row) => [...row, ...row]),
		...smaller.map((row) => [...row, ...row.map((entry) => -entry)]),
	];
}

function expectClose(actual: readonly number[], expected: readonly number[]): void {
	expect(actual).toHaveLength(expected.length);
	for (const [index, value] of expected.entries()) expect(actual[index]).toBeCloseTo(value, 12);
}

describe("basisState", () => {
	it("has a single 1 at its index", () => {
		expect(basisState(1, 0)).toEqual([1, 0]);
		expect(basisState(2, 3)).toEqual([0, 0, 0, 1]);
		expect(qubitCount(basisState(3, 5))).toBe(3);
	});

	it("rejects an index the qubits cannot hold", () => {
		expect(() => basisState(2, 4)).toThrow(RangeError);
		expect(() => basisState(1, -1)).toThrow(RangeError);
	});
});

describe("hadamardOnEveryQubit", () => {
	const plus = [Math.SQRT1_2, Math.SQRT1_2];
	const minus = [Math.SQRT1_2, -Math.SQRT1_2];

	it("turns the definite bits into the two fair coins", () => {
		expectClose(hadamardOnEveryQubit(basisState(1, 0)), plus);
		expectClose(hadamardOnEveryQubit(basisState(1, 1)), minus);
	});

	it("turns the fair coins back into definite bits", () => {
		expectClose(hadamardOnEveryQubit(plus), [1, 0]);
		expectClose(hadamardOnEveryQubit(minus), [0, 1]);
	});

	it.each([1, 2, 3, 4])("sends each basis state of %i qubits to its signed column", (qubits) => {
		const size = 2 ** qubits;
		for (let x = 0; x < size; x++) {
			const expected = Array.from(
				{ length: size },
				(_, gamma) => hadamardSign(gamma, x) / Math.sqrt(size),
			);
			const column = hadamardOnEveryQubit(basisState(qubits, x));
			expectClose(column, expected);
			expect(column.map(formatAmplitude)).toEqual(expected.map(formatAmplitude));
		}
	});

	it.each([1, 2, 3])("is the Walsh-Hadamard matrix of %i qubits over sqrt(2^n)", (qubits) => {
		const matrix = walshHadamard(qubits);
		const size = 2 ** qubits;
		const drawn = Array.from({ length: size }, (_, index) => Math.sin(3 * index + 1));
		const length = Math.hypot(...drawn);
		const state = drawn.map((value) => value / length);
		const expected = matrix.map(
			(row) =>
				row.reduce((sum, entry, column) => sum + entry * (state[column] ?? 0), 0) / size ** 0.5,
		);
		const actual = hadamardOnEveryQubit(state);
		expectClose(actual, expected);
		expect(actual.map(formatAmplitude)).toEqual(expected.map(formatAmplitude));
	});

	it("gives the uniform superposition from the all-zero state", () => {
		expectClose(
			hadamardOnEveryQubit(basisState(3, 0)),
			Array.from({ length: 8 }, () => 8 ** -0.5),
		);
	});

	it("is its own inverse and keeps the state a unit vector", () => {
		const state = [0.5, -0.5, 0.1, Math.sqrt(0.49)];
		const transformed = hadamardOnEveryQubit(state);
		expect(sum(probabilities(transformed))).toBeCloseTo(1, 12);
		expectClose(hadamardOnEveryQubit(transformed), state);
	});

	it("does not change the state it is given", () => {
		const state = [1, 0];
		hadamardOnEveryQubit(state);
		expect(state).toEqual([1, 0]);
	});
});

describe("settled", () => {
	it("clears what rounding left of a cancelled amplitude and nothing else", () => {
		expect(settled([1, -1e-17, 1e-3, 3e-16])).toEqual([1, 0, 1e-3, 0]);
	});
});

describe("probabilities", () => {
	it("squares the amplitudes, so a sign never shows", () => {
		expectClose(probabilities([Math.SQRT1_2, -Math.SQRT1_2]), [0.5, 0.5]);
	});
});

describe("bitstring", () => {
	it("writes an index with one digit per qubit", () => {
		expect(bitstring(0, 3)).toBe("000");
		expect(bitstring(5, 3)).toBe("101");
		expect(bitstring(1, 1)).toBe("1");
	});
});

describe("bitstrings", () => {
	it("lists every bitstring of a length in counting order", () => {
		expect(bitstrings(1)).toEqual(["0", "1"]);
		expect(bitstrings(2)).toEqual(["00", "01", "10", "11"]);
		expect(bitstrings(3)).toHaveLength(8);
		expect(bitstrings(3)[5]).toBe("101");
	});
});
