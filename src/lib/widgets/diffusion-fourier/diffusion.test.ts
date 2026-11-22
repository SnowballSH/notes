import { describe, expect, it } from "vitest";
import {
	afterQueryingAnd,
	averageLabel,
	barBox,
	describeAverage,
	diffuse,
	isSameState,
	scaledFourierCoefficients,
} from "./diffusion";

const root8 = Math.sqrt(8);
const skewed = [0.1, -0.7, 0.5, 0.2, 0, 0.3, -0.3, 0.1];

function expectClose(actual: readonly number[], expected: readonly number[]): void {
	expect(actual).toHaveLength(expected.length);
	actual.forEach((amplitude, index) => {
		expect(amplitude).toBeCloseTo(expected[index] ?? Number.NaN, 12);
	});
}

describe("afterQueryingAnd", () => {
	it("is (1/2, 1/2, 1/2, −1/2) on two qubits", () => {
		expect(afterQueryingAnd(2)).toEqual([0.5, 0.5, 0.5, -0.5]);
	});

	it("negates only the all-ones input on three qubits", () => {
		expectClose(
			afterQueryingAnd(3),
			[1, 1, 1, 1, 1, 1, 1, -1].map((sign) => sign / root8),
		);
	});
});

describe("diffuse", () => {
	it("takes (1/2, 1/2, 1/2, −1/2) to exactly (0, 0, 0, 1)", () => {
		expect(diffuse([0.5, 0.5, 0.5, -0.5])).toEqual([0, 0, 0, 1]);
	});

	it("gives 5/(2√8) on the negated input and 1/(2√8) elsewhere on three qubits", () => {
		expectClose(
			diffuse(afterQueryingAnd(3)),
			[1, 1, 1, 1, 1, 1, 1, 5].map((multiple) => multiple / (2 * root8)),
		);
	});

	it("leaves the uniform superposition as it is", () => {
		expectClose(diffuse([0.5, 0.5, 0.5, 0.5]), [0.5, 0.5, 0.5, 0.5]);
	});

	it("is its own inverse", () => {
		expectClose(diffuse(diffuse(skewed)), skewed);
		expect(diffuse(diffuse([0.5, 0.5, 0.5, -0.5]))).toEqual([0.5, 0.5, 0.5, -0.5]);
	});
});

describe("scaledFourierCoefficients", () => {
	it("is (1/2, 1/2, 1/2, −1/2) for the state after querying AND on two qubits", () => {
		expectClose(scaledFourierCoefficients([0.5, 0.5, 0.5, -0.5]), [0.5, 0.5, 0.5, -0.5]);
	});

	it("is 3/4 at 000 and ±1/4 elsewhere for the state after querying AND on three qubits", () => {
		expectClose(
			scaledFourierCoefficients(afterQueryingAnd(3)),
			[0.75, 0.25, 0.25, -0.25, 0.25, -0.25, -0.25, 0.25],
		);
	});

	it("keeps its first entry and negates every other when D is applied", () => {
		expectClose(scaledFourierCoefficients(diffuse([0.5, 0.5, 0.5, -0.5])), [0.5, -0.5, -0.5, 0.5]);
		const [first = Number.NaN, ...rest] = scaledFourierCoefficients(skewed);
		expectClose(scaledFourierCoefficients(diffuse(skewed)), [
			first,
			...rest.map((coefficient) => -coefficient),
		]);
		expect(first).toBeCloseTo(0.2 / root8, 12);
	});
});

describe("isSameState", () => {
	it("ignores rounding but not a changed amplitude or length", () => {
		expect(isSameState([0.5, 0.5, 0.5, -0.5], [0.5, 0.5, 0.5 + 1e-13, -0.5])).toBe(true);
		expect(isSameState([0.5, 0.5, 0.5, -0.5], [0.5, 0.5, 0.5, 0.5])).toBe(false);
		expect(isSameState([1, 0], [1, 0, 0, 0])).toBe(false);
	});
});

describe("describeAverage", () => {
	it("states a dyadic average as a fraction", () => {
		expect(describeAverage([0.5, 0.5, 0.5, -0.5])).toBe("The average amplitude is 1/4.");
		expect(describeAverage([0, 0, 0, 1])).toBe("The average amplitude is 1/4.");
		expect(describeAverage([0.5, 0.5, 0.5, 0.5])).toBe("The average amplitude is 1/2.");
	});

	it("states any other average to two decimal places", () => {
		expect(describeAverage(afterQueryingAnd(3))).toBe("The average amplitude is 0.27.");
	});

	it("puts a minus sign on a negative average and none on zero", () => {
		expect(describeAverage([-0.5, -0.5, -0.5, 0.5])).toBe("The average amplitude is −1/4.");
		expect(describeAverage([0.5, -0.5, 0.5, -0.5])).toBe("The average amplitude is 0.");
		expect(describeAverage([-1e-13, 0, 0, 0])).toBe("The average amplitude is 0.");
	});
});

describe("averageLabel", () => {
	it("writes the average as μ, a fraction when it is dyadic", () => {
		expect(averageLabel([0.5, 0.5, 0.5, -0.5])).toBe("μ = 1/4");
		expect(averageLabel([0, 0, 0, 1])).toBe("μ = 1/4");
		expect(averageLabel([0.5, 0.5, 0.5, 0.5])).toBe("μ = 1/2");
		expect(averageLabel(afterQueryingAnd(3))).toBe("μ = 0.27");
	});

	it("puts a minus sign on a negative average and none on zero", () => {
		expect(averageLabel([-0.5, -0.5, -0.5, 0.5])).toBe("μ = −1/4");
		expect(averageLabel([-1e-13, 0, 0, 0])).toBe("μ = 0");
	});
});

describe("barBox", () => {
	it("stands a positive bar on the axis and hangs a negative one from it", () => {
		expect(barBox(0.5)).toEqual({ top: 25, height: 25 });
		expect(barBox(-0.5)).toEqual({ top: 50, height: 25 });
		expect(barBox(1)).toEqual({ top: 0, height: 50 });
	});

	it("has no height at zero and stays inside the plot", () => {
		expect(barBox(0).height).toBe(0);
		expect(barBox(-1.5)).toEqual({ top: 50, height: 50 });
	});
});
