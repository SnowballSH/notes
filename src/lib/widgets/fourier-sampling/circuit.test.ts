import { describe, expect, it } from "vitest";
import { formatAmplitude } from "../../quantum/format";
import { fourierCoefficients } from "../../quantum/fourier";
import {
	depthBelowZero,
	describeOutcomes,
	emptyTally,
	formatProbability,
	fourierSampling,
	measure,
	presetNames,
	presetTable,
	recorded,
	sameTable,
	type TruthTable,
	toggled,
} from "./circuit";

function expectClose(actual: readonly number[], expected: readonly number[]): void {
	expect(actual).toHaveLength(expected.length);
	for (const [index, value] of expected.entries()) expect(actual[index]).toBeCloseTo(value, 12);
}

const sampled = (table: TruthTable) => fourierSampling(table).afterSecondHadamard;

describe("the presets", () => {
	it("are the truth tables their names say", () => {
		expect(presetTable("and", 2)).toEqual([0, 0, 0, 1]);
		expect(presetTable("parity", 3)).toEqual([0, 1, 1, 0, 1, 0, 0, 1]);
		expect(presetTable("constant", 2)).toEqual([0, 0, 0, 0]);
		expect(presetTable("balanced", 3)).toEqual([0, 0, 0, 0, 1, 1, 1, 1]);
		expect(presetTable("one-marked", 3)).toEqual([0, 1, 0, 0, 0, 0, 0, 0]);
	});

	it("are all different functions", () => {
		for (const qubits of [2, 3, 4]) {
			const tables = presetNames.map((preset) => presetTable(preset, qubits).join(""));
			expect(new Set(tables).size).toBe(presetNames.length);
		}
	});

	it("have one value for each input", () => {
		for (const preset of presetNames) expect(presetTable(preset, 4)).toHaveLength(16);
	});
});

describe("editing a truth table", () => {
	it("flips one value and leaves the table it came from alone", () => {
		const table = presetTable("and", 2);
		expect(toggled(table, 1)).toEqual([0, 1, 0, 1]);
		expect(toggled(table, 3)).toEqual([0, 0, 0, 0]);
		expect(table).toEqual([0, 0, 0, 1]);
	});

	it("recognises a preset reached by hand", () => {
		expect(sameTable(toggled(presetTable("and", 2), 3), presetTable("constant", 2))).toBe(true);
		expect(sameTable(presetTable("and", 2), presetTable("parity", 2))).toBe(false);
		expect(sameTable(presetTable("constant", 2), presetTable("constant", 3))).toBe(false);
	});
});

describe("Fourier sampling", () => {
	it("goes through the uniform state and the signed state", () => {
		const { afterHadamard, afterQuery } = fourierSampling(presetTable("and", 2));
		expectClose(afterHadamard, [0.5, 0.5, 0.5, 0.5]);
		expectClose(afterQuery, [0.5, 0.5, 0.5, -0.5]);
	});

	it("gives (1/2, 1/2, 1/2, −1/2) for AND on two bits", () => {
		const state = sampled(presetTable("and", 2));
		expectClose(state, [0.5, 0.5, 0.5, -0.5]);
		expect(state.map(formatAmplitude)).toEqual(["+1/2", "+1/2", "+1/2", "−1/2"]);
	});

	it("puts all the amplitude of parity on 11…1", () => {
		expectClose(sampled(presetTable("parity", 2)), [0, 0, 0, 1]);
		expectClose(sampled(presetTable("parity", 3)), [0, 0, 0, 0, 0, 0, 0, 1]);
		expectClose(sampled(presetTable("parity", 4)), [...emptyTally(15), 1]);
	});

	it("puts all the amplitude of a constant on 00…0", () => {
		expectClose(sampled(presetTable("constant", 2)), [1, 0, 0, 0]);
		expectClose(sampled(presetTable("constant", 4)), [1, ...emptyTally(15)]);
		expectClose(sampled([1, 1, 1, 1]), [-1, 0, 0, 0]);
	});

	it("puts none of the amplitude of a balanced function on 00…0", () => {
		expectClose(sampled(presetTable("balanced", 3)), [0, 0, 0, 0, 1, 0, 0, 0]);
		expect(sampled([0, 1, 1, 0, 1, 0, 0, 1])[0]).toBe(0);
		expect(sampled([1, 0, 0, 1])[0]).toBe(0);
	});

	it("leaves 1 − 2/N at 0 for one marked input", () => {
		expectClose(sampled(presetTable("one-marked", 2)), [0.5, 0.5, -0.5, 0.5]);
		expect(sampled(presetTable("one-marked", 3))[0]).toBeCloseTo(0.75, 12);
		expect(sampled(presetTable("one-marked", 4))[0]).toBeCloseTo(0.875, 12);
		expect(sampled([0, 0, 1, 0, 0, 0, 0, 0])[0]).toBeCloseTo(0.75, 12);
	});

	it("ends on the Fourier coefficients of (−1)^f", () => {
		const table: TruthTable = [0, 1, 1, 1, 0, 0, 1, 0];
		const signs = table.map((value) => (value === 1 ? -1 : 1));
		expectClose(sampled(table), fourierCoefficients(signs));
		expectClose(sampled(table), [0, 0, 0.5, 0.5, -0.5, 0.5, 0, 0]);
	});
});

describe("measuring", () => {
	it("draws an outcome with the square of its amplitude as its chance", () => {
		const state = sampled(presetTable("and", 2));
		expect(measure(state, () => 0)).toBe(0);
		expect(measure(state, () => 0.3)).toBe(1);
		expect(measure(state, () => 0.6)).toBe(2);
		expect(measure(state, () => 0.99)).toBe(3);
	});

	it("always gives 11 for parity on two bits", () => {
		const state = sampled(presetTable("parity", 2));
		for (const point of [0, 0.5, 0.999999]) expect(measure(state, () => point)).toBe(3);
	});

	it("counts outcomes without changing the tally it extends", () => {
		const empty = emptyTally(4);
		const twice = recorded(recorded(empty, 3), 3);
		expect(empty).toEqual([0, 0, 0, 0]);
		expect(recorded(twice, 1)).toEqual([0, 1, 0, 2]);
	});
});

describe("the room a row needs below its axis", () => {
	it("is none when no amplitude is negative", () => {
		for (const preset of presetNames)
			expect(depthBelowZero(fourierSampling(presetTable(preset, 3)).afterHadamard)).toBe(0);
		expect(depthBelowZero(sampled(presetTable("parity", 2)))).toBe(0);
	});

	it("is the size of the most negative amplitude", () => {
		expect(depthBelowZero(fourierSampling(presetTable("and", 2)).afterQuery)).toBeCloseTo(0.5, 12);
		expect(depthBelowZero(sampled(presetTable("one-marked", 3)))).toBeCloseTo(0.25, 12);
		expect(depthBelowZero(sampled([1, 1, 1, 1]))).toBeCloseTo(1, 12);
	});
});

describe("formatProbability", () => {
	it("writes the square of an amplitude as an exact fraction", () => {
		expect(formatProbability(0.75 ** 2, 3)).toBe("9/16");
		expect(formatProbability(0.25 ** 2, 3)).toBe("1/16");
		expect(formatProbability(0.875 ** 2, 4)).toBe("49/64");
		expect(formatProbability(1 / 8, 3)).toBe("1/8");
		expect(formatProbability(0.25, 2)).toBe("1/4");
	});

	it("writes certainty and impossibility as whole numbers", () => {
		expect(formatProbability(1, 4)).toBe("1");
		expect(formatProbability(0, 2)).toBe("0");
	});

	it("gives fractions that sum to one for every preset", () => {
		for (const preset of presetNames) {
			const shown = sampled(presetTable(preset, 3)).map((amplitude) =>
				formatProbability(amplitude ** 2, 3),
			);
			const total = shown
				.map((fraction) => fraction.split("/").map(Number))
				.reduce((sum, [top = 0, bottom = 1]) => sum + top / bottom, 0);
			expect(total).toBeCloseTo(1, 12);
		}
	});
});

describe("describeOutcomes", () => {
	it("names a certain outcome", () => {
		expect(describeOutcomes(sampled(presetTable("parity", 2)))).toBe("The outcome is always 11.");
		expect(describeOutcomes(sampled(presetTable("constant", 3)))).toBe(
			"The outcome is always 000.",
		);
		expect(describeOutcomes(sampled(presetTable("balanced", 4)))).toBe(
			"The outcome is always 1000.",
		);
	});

	it("says when every outcome is equally likely", () => {
		expect(describeOutcomes(sampled(presetTable("and", 2)))).toBe(
			"Every outcome has probability 1/4.",
		);
	});

	it("names the likeliest outcome and its probability", () => {
		expect(describeOutcomes(sampled(presetTable("and", 3)))).toBe(
			"The likeliest outcome is 000, with probability 9/16.",
		);
		expect(describeOutcomes(sampled(presetTable("one-marked", 4)))).toBe(
			"The likeliest outcome is 0000, with probability 49/64.",
		);
	});

	it("counts the outcomes that tie for likeliest", () => {
		expect(describeOutcomes(sampled([0, 1, 1, 1, 0, 0, 1, 0]))).toBe(
			"The 4 likeliest outcomes each have probability 1/4.",
		);
	});
});
