import { describe, expect, it } from "vitest";
import {
	bestIterations,
	groverAngle,
	groverIteration,
	invertAboutMean,
	mean,
	signOracle,
	successProbability,
	uniformSuperposition,
} from "./grover";
import { type Amplitudes, basisState, hadamardOnEveryQubit } from "./state";

function expectClose(actual: readonly number[], expected: readonly number[]): void {
	expect(actual).toHaveLength(expected.length);
	for (const [index, value] of expected.entries()) expect(actual[index]).toBeCloseTo(value, 12);
}

const iterated = (state: Amplitudes, marked: ReadonlySet<number>, iterations: number): Amplitudes =>
	Array.from({ length: iterations }).reduce<Amplitudes>(
		(current) => groverIteration(current, marked),
		state,
	);

const markedProbability = (state: Amplitudes, marked: ReadonlySet<number>): number =>
	state.reduce((sum, amplitude, index) => sum + (marked.has(index) ? amplitude ** 2 : 0), 0);

describe("mean", () => {
	it("averages the amplitudes, signs included", () => {
		expect(mean([0.5, 0.5, 0.5, 0.5])).toBe(0.5);
		expect(mean([0.5, 0.5, 0.5, -0.5])).toBe(0.25);
		expect(mean([1, -1])).toBe(0);
	});
});

describe("signOracle", () => {
	it("negates the marked amplitudes and no others", () => {
		expect(signOracle([0.5, 0.5, 0.5, 0.5], new Set([2]))).toEqual([0.5, 0.5, -0.5, 0.5]);
		expect(signOracle([0.1, -0.2, 0.3, 0.4], new Set([1, 3]))).toEqual([0.1, 0.2, 0.3, -0.4]);
		expect(signOracle([0.6, 0.8], new Set())).toEqual([0.6, 0.8]);
	});
});

describe("invertAboutMean", () => {
	it("moves each amplitude to the other side of the mean", () => {
		expect(invertAboutMean([0.5, 0.5, 0.5, -0.5])).toEqual([0, 0, 0, 1]);
		expect(invertAboutMean([1, 0, 0, 0])).toEqual([-0.5, 0.5, 0.5, 0.5]);
		expect(invertAboutMean([0.5, 0.5, 0.5, 0.5])).toEqual([0.5, 0.5, 0.5, 0.5]);
	});

	it.each<[string, Amplitudes]>([
		["a basis state", basisState(3, 5)],
		["a marked uniform state", signOracle(uniformSuperposition(3), new Set([6]))],
		["an uneven state of two qubits", [0.5, -0.5, 0.1, Math.sqrt(0.49)]],
		["an uneven state of four qubits", Array.from({ length: 16 }, (_, x) => Math.sin(3 * x + 1))],
	])("is a phase flip of all but 0…0 between two layers of Hadamard gates, on %s", (_, state) => {
		const flipped = hadamardOnEveryQubit(state).map((amplitude, index) =>
			index === 0 ? amplitude : -amplitude,
		);
		expectClose(invertAboutMean(state), hadamardOnEveryQubit(flipped));
	});
});

describe("uniformSuperposition", () => {
	it("gives every input the amplitude 1/√N", () => {
		expect(uniformSuperposition(2)).toEqual([0.5, 0.5, 0.5, 0.5]);
		expectClose(
			uniformSuperposition(3),
			Array.from({ length: 8 }, () => 1 / Math.sqrt(8)),
		);
		expectClose(uniformSuperposition(4), hadamardOnEveryQubit(basisState(4, 0)));
	});
});

describe("groverIteration", () => {
	it("finds one marked input among four in a single step", () => {
		for (const target of [0, 1, 2, 3])
			expect(groverIteration(uniformSuperposition(2), new Set([target]))).toEqual(
				basisState(2, target),
			);
	});

	it("raises the marked amplitude among eight from 1/√8 to 5/(2√8)", () => {
		const once = groverIteration(uniformSuperposition(3), new Set([3]));
		expectClose(
			once,
			[0.5, 0.5, 0.5, 2.5, 0.5, 0.5, 0.5, 0.5].map((value) => value / Math.sqrt(8)),
		);
	});
});

describe("the closed forms", () => {
	it("give the angle whose sine is the marked amplitude of the uniform state", () => {
		expect(groverAngle(4, 1)).toBeCloseTo(Math.PI / 6, 12);
		expect(groverAngle(8, 2)).toBeCloseTo(Math.PI / 6, 12);
		expect(groverAngle(8, 1)).toBeCloseTo(0.361367, 6);
	});

	it("give the success probabilities for one marked input among eight", () => {
		const chances = [0, 1, 2, 3, 4].map((iterations) => successProbability(8, 1, iterations));
		expect(chances[0]).toBeCloseTo(0.125, 12);
		expect(chances.map((chance) => chance.toFixed(3))).toEqual([
			"0.125",
			"0.781",
			"0.945",
			"0.330",
			"0.012",
		]);
	});

	it("give certainty after one iteration for one marked input among four", () => {
		expect(successProbability(4, 1, 1)).toBeCloseTo(1, 12);
		expect(successProbability(4, 1, 0)).toBeCloseTo(0.25, 12);
	});

	it("give the best number of iterations", () => {
		expect(bestIterations(4, 1)).toBe(1);
		expect(bestIterations(8, 1)).toBe(2);
		expect(bestIterations(16, 1)).toBe(3);
		expect(bestIterations(1024, 1)).toBe(25);
		expect(bestIterations(16, 4)).toBe(1);
	});

	it.each<[number, number[]]>([
		[3, [5]],
		[4, [0]],
		[4, [2, 9, 15]],
		[5, [7, 30]],
	])("agree with iterating a state of %i qubits with %j marked", (qubits, targets) => {
		const marked = new Set(targets);
		for (let iterations = 0; iterations <= 6; iterations++) {
			const state = iterated(uniformSuperposition(qubits), marked, iterations);
			expect(markedProbability(state, marked)).toBeCloseTo(
				successProbability(2 ** qubits, marked.size, iterations),
				12,
			);
		}
	});
});
