import { describe, expect, it } from "vitest";
import { fourierCoefficients, walshHadamard } from "./fourier";
import { hadamardOnEveryQubit } from "./state";

describe("walshHadamard", () => {
	it("leaves a single value alone", () => {
		expect(walshHadamard([7])).toEqual([7]);
	});

	it("takes the sum and the difference of two values", () => {
		expect(walshHadamard([3, 5])).toEqual([8, -2]);
	});

	it("multiplies by the matrix of signs (-1)^(s·x)", () => {
		expect(walshHadamard([1, 2, 3, 4])).toEqual([10, -2, -4, 0]);
		expect(walshHadamard([1, 0, 0, 0, 0, 0, 0, 0])).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
		expect(walshHadamard([0, 0, 0, 0, 0, 1, 0, 0])).toEqual([1, -1, 1, -1, -1, 1, -1, 1]);
	});

	it("multiplies by the length when applied twice", () => {
		expect(walshHadamard(walshHadamard([1, 2, 3, 4]))).toEqual([4, 8, 12, 16]);
		const values = [5, -3, 0, 2, 7, 1, -4, 6];
		expect(walshHadamard(walshHadamard(values))).toEqual(values.map((value) => 8 * value));
	});

	it.each([1, 2, 3, 4])("is √N times a Hadamard gate on each of %i qubits", (qubits) => {
		const size = 2 ** qubits;
		const values = Array.from({ length: size }, (_, index) => Math.sin(3 * index + 1));
		const gates = hadamardOnEveryQubit(values);
		for (const [index, sum] of walshHadamard(values).entries())
			expect(sum).toBeCloseTo(Math.sqrt(size) * (gates[index] ?? 0), 12);
	});

	it("does not change the vector it is given", () => {
		const values = [1, 2];
		walshHadamard(values);
		expect(values).toEqual([1, 2]);
	});

	it("rejects a length that is not a power of two", () => {
		expect(() => walshHadamard([1, 2, 3])).toThrow(RangeError);
		expect(() => walshHadamard([])).toThrow(RangeError);
	});
});

describe("fourierCoefficients", () => {
	it("puts a constant function on the empty set", () => {
		expect(fourierCoefficients([1, 1, 1, 1])).toEqual([1, 0, 0, 0]);
	});

	it("puts a parity function on its own set", () => {
		const parityOfBothBits = [1, -1, -1, 1];
		expect(fourierCoefficients(parityOfBothBits)).toEqual([0, 0, 0, 1]);
	});

	it("spreads AND of two bits, in ±1 form, over all four sets", () => {
		expect(fourierCoefficients([1, 1, 1, -1])).toEqual([0.5, 0.5, 0.5, -0.5]);
	});

	it("spreads majority of three bits over the singletons and the whole set", () => {
		const majority = [1, 1, 1, -1, 1, -1, -1, -1];
		expect(fourierCoefficients(majority)).toEqual([0, 0.5, 0.5, 0, 0.5, 0, 0, -0.5]);
	});
});
