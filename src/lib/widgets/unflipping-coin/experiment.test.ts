import { describe, expect, it } from "vitest";
import {
	applyHadamard,
	cancels,
	definiteBit,
	describeStep,
	formatTerms,
	hadamardTerms,
	measure,
	result,
	start,
	stateName,
	summarise,
	toss,
} from "./experiment";

const half = Math.SQRT1_2;

function expectClose(actual: readonly number[], expected: readonly number[]): void {
	expect(actual).toHaveLength(expected.length);
	for (const [index, value] of expected.entries()) expect(actual[index]).toBeCloseTo(value, 12);
}

describe("the unflipping experiment", () => {
	it("starts with a definite 0 on both sides", () => {
		expect(start.qubit).toEqual([1, 0]);
		expect(start.coin).toEqual([1, 0]);
		expect(summarise(start)).toBe("Qubit |0⟩; coin 0.");
	});

	it("makes both a fair coin with one Hadamard gate", () => {
		const once = applyHadamard(start);
		expectClose(once.qubit, [half, half]);
		expect(once.coin).toEqual([0.5, 0.5]);
		expect(stateName(once.qubit)).toBe("|+⟩");
		expect(summarise(once)).toBe("Qubit |+⟩; coin fair.");
	});

	it("unflips the qubit with a second gate, but not the coin", () => {
		const twice = applyHadamard(applyHadamard(start));
		expectClose(twice.qubit, [1, 0]);
		expect(twice.coin).toEqual([0.5, 0.5]);
		expect(definiteBit(twice.qubit)).toBe(0);
		expect(twice.terms?.map(cancels)).toEqual([false, true]);
		expect(summarise(twice)).toBe("Qubit |0⟩, the |1⟩ terms cancel; coin fair.");
	});

	it("loses the interference when measured in between", () => {
		const measured = measure(applyHadamard(start), () => 0.75);
		expect(measured.qubit).toEqual([0, 1]);
		expect(measured.coin).toEqual([0, 1]);
		expect(measured.terms).toBeUndefined();
		expect(summarise(measured)).toBe("Measured 1: qubit |1⟩; coin 1.");
		const after = applyHadamard(measured);
		expectClose(after.qubit, [half, -half]);
		expect(stateName(after.qubit)).toBe("|−⟩");
		expect(summarise(after)).toBe("Qubit |−⟩; coin fair.");
		expect(summarise(applyHadamard(after))).toBe("Qubit |1⟩, the |0⟩ terms cancel; coin fair.");
		expectClose(applyHadamard(after).qubit, [0, 1]);
	});

	it("measures 0 with certainty after two gates, whatever the random source says", () => {
		for (const point of [0, 0.5, 0.999999]) {
			const points = [point, 0];
			const result = measure(applyHadamard(applyHadamard(start)), () => points.shift() ?? 0);
			expect(result.steps.at(-1)).toEqual({ kind: "measurement", qubit: 0, coin: 0 });
		}
	});

	it("draws the qubit and the coin separately", () => {
		const points = [0.1, 0.9];
		const result = measure(applyHadamard(start), () => points.shift() ?? 0);
		expect(result.steps.at(-1)).toEqual({ kind: "measurement", qubit: 0, coin: 1 });
	});

	it("shows a result only straight after a measurement", () => {
		const once = applyHadamard(start);
		expect(result(start)).toBe("");
		expect(result(once)).toBe("");
		expect(result(measure(once, () => 0.75))).toBe("Measured 1");
		expect(result(measure(applyHadamard(once), () => 0.75))).toBe("Measured 0");
		expect(result(applyHadamard(measure(once, () => 0.75)))).toBe("");
	});

	it("records its steps in order without changing the experiment it extends", () => {
		const once = applyHadamard(start);
		const measured = measure(once, () => 0);
		expect(start.steps).toEqual([]);
		expect(once.steps.map(describeStep)).toEqual(["H"]);
		expect(measured.steps.map(describeStep)).toEqual(["H", "measure: 0"]);
	});
});

describe("hadamardTerms", () => {
	it("splits each new amplitude into what each old amplitude contributes", () => {
		const [zero, one] = hadamardTerms([half, half]);
		expectClose(zero, [0.5, 0.5]);
		expectClose(one, [0.5, -0.5]);
		expect(formatTerms(one)).toBe("+1/2 −1/2");
		expect(cancels(zero)).toBe(false);
		expect(cancels(one)).toBe(true);
	});

	it("has nothing to cancel from a definite bit", () => {
		expect(hadamardTerms([1, 0]).map(cancels)).toEqual([false, false]);
		expect(hadamardTerms([0, 1]).map(cancels)).toEqual([false, false]);
	});
});

describe("toss", () => {
	it("is fair whatever the coin showed", () => {
		expect(toss([1, 0])).toEqual([0.5, 0.5]);
		expect(toss([0, 1])).toEqual([0.5, 0.5]);
		expect(toss([0.5, 0.5])).toEqual([0.5, 0.5]);
	});
});
