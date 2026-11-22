import { expect, it, describe as suite } from "vitest";
import { mean } from "../../quantum/grover";
import {
	caption,
	defaultMarked,
	describe,
	describeColumn,
	iterationsDone,
	nextStep,
	shownAmplitude,
	stateAfter,
} from "./steps";

const root8 = Math.sqrt(8);

suite("stateAfter", () => {
	it("starts in the uniform superposition", () => {
		for (const amplitude of stateAfter(3, 5, 0)) expect(amplitude).toBeCloseTo(1 / root8, 12);
	});

	it("negates only the marked amplitude in the query", () => {
		const queried = stateAfter(3, 5, 1);
		queried.forEach((amplitude, index) => {
			expect(amplitude).toBeCloseTo((index === 5 ? -1 : 1) / root8, 12);
		});
		expect(mean(queried)).toBeCloseTo(3 / (4 * root8), 12);
	});

	it("gives 5/(2√8) on the marked input and 1/(2√8) elsewhere after one iteration", () => {
		const once = stateAfter(3, 5, 2);
		expect(once[5]).toBeCloseTo(0.884, 3);
		expect(once[5]).toBeCloseTo(5 / (2 * root8), 12);
		once.forEach((amplitude, index) => {
			if (index !== 5) expect(amplitude).toBeCloseTo(1 / (2 * root8), 12);
		});
		expect(once[0]).toBeCloseTo(0.177, 3);
	});

	it("measures the marked input with probability 0.945 after two iterations", () => {
		const twice = stateAfter(3, 5, 4);
		expect((twice[5] ?? 0) ** 2).toBeCloseTo(121 / 128, 12);
		expect((twice[5] ?? 0) ** 2).toBeCloseTo(0.945, 3);
		expect(twice[0]).toBeCloseTo(-1 / (4 * root8), 12);
	});

	it("reaches the marked input exactly after one iteration on two qubits", () => {
		expect(stateAfter(2, 2, 2)).toEqual([0, 0, 1, 0]);
		expect(stateAfter(2, 0, 2)).toEqual([1, 0, 0, 0]);
	});

	it("overshoots on a third iteration", () => {
		expect((stateAfter(3, 5, 6)[5] ?? 0) ** 2).toBeCloseTo(0.33, 3);
	});
});

suite("the order of steps", () => {
	it("alternates, starting with the query", () => {
		expect([0, 1, 2, 3].map(nextStep)).toEqual(["query", "diffuse", "query", "diffuse"]);
	});

	it("counts an iteration once both of its steps are done", () => {
		expect([0, 1, 2, 3, 4].map(iterationsDone)).toEqual([0, 0, 1, 1, 2]);
	});
});

suite("defaultMarked", () => {
	it("is 10, 101 and 1010", () => {
		expect([2, 3, 4].map(defaultMarked)).toEqual([2, 5, 10]);
	});
});

suite("describe", () => {
	it("states the chance of the marked input after whole iterations", () => {
		expect(describe(3, 5, 0)).toBe("Before any query, 101 is measured with probability 1/8.");
		expect(describe(3, 5, 2)).toBe("After 1 iteration, 101 is measured with probability 0.78.");
		expect(describe(3, 5, 4)).toBe("After 2 iterations, 101 is measured with probability 0.95.");
		expect(describe(2, 3, 2)).toBe("After 1 iteration, 11 is measured with probability 1.");
		expect(describe(4, 15, 2)).toBe("After 1 iteration, 1111 is measured with probability 0.47.");
	});

	it("states the average between the query and the diffusion", () => {
		expect(describe(3, 5, 1)).toBe("Query 1 negates the amplitude of 101: the average μ is +0.27.");
		expect(describe(2, 3, 1)).toBe("Query 1 negates the amplitude of 11: the average μ is +1/4.");
		expect(describe(4, 15, 1)).toBe(
			"Query 1 negates the amplitude of 1111: the average μ is +0.22.",
		);
		expect(describe(3, 5, 5)).toBe(`Query 3 negates the amplitude of 101: the average μ is −0.20.`);
	});
});

suite("caption", () => {
	it("is the chance of the marked input after whole iterations", () => {
		expect(caption(3, 5, 0)).toBe("P(101) = 1/8");
		expect(caption(3, 5, 2)).toBe("P(101) = 0.78");
		expect(caption(3, 5, 4)).toBe("P(101) = 0.95");
		expect(caption(2, 3, 2)).toBe("P(11) = 1");
		expect(caption(4, 15, 2)).toBe("P(1111) = 0.47");
	});

	it("is the average between the query and the diffusion", () => {
		expect(caption(3, 5, 1)).toBe("μ = 0.27");
		expect(caption(2, 3, 1)).toBe("μ = 1/4");
		expect(caption(4, 15, 1)).toBe("μ = 0.22");
		expect(caption(3, 5, 5)).toBe("μ = −0.20");
	});
});

suite("shownAmplitude", () => {
	it("is two decimals without a plus sign", () => {
		expect(stateAfter(3, 5, 0).map(shownAmplitude)).toEqual(Array(8).fill("0.35"));
		expect(shownAmplitude(stateAfter(3, 5, 2)[5] ?? 0)).toBe("0.88");
		expect(shownAmplitude(stateAfter(3, 5, 2)[0] ?? 0)).toBe("0.18");
	});

	it("keeps the minus sign", () => {
		expect(shownAmplitude(stateAfter(3, 5, 1)[5] ?? 0)).toBe("−0.35");
		expect(shownAmplitude(stateAfter(3, 5, 4)[0] ?? 0)).toBe("−0.09");
		expect(shownAmplitude(stateAfter(3, 5, 3)[5] ?? 0)).toBe("−0.88");
	});

	it("shows whole numbers and zero without decimals or a sign", () => {
		expect(stateAfter(2, 2, 2).map(shownAmplitude)).toEqual(["0", "0", "1", "0"]);
		expect(shownAmplitude(stateAfter(2, 2, 3)[2] ?? 0)).toBe("−1");
		expect(shownAmplitude(-0.004)).toBe("0");
		expect(shownAmplitude(0.5)).toBe("0.50");
	});
});

suite("describeColumn", () => {
	it("gives the exact amplitude and the probability, and says which bar is marked", () => {
		expect(describeColumn("101", -1 / root8, true)).toBe(
			"101: marked, amplitude −1/√8, probability 1/8",
		);
		expect(describeColumn("000", 1 / root8, false)).toBe("000: amplitude +1/√8, probability 1/8");
		expect(describeColumn("10", 0, false)).toBe("10: amplitude 0, probability 0");
	});
});
