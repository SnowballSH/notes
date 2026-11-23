import { describe, expect, it } from "vitest";
import { walshHadamard } from "../../quantum/fourier";
import {
	canStep,
	defaults,
	inputLabel,
	inputs,
	pairsWithXor,
	productsFor,
	resultName,
	stepped,
	sumExpression,
	type Values,
	xorConvolution,
} from "./convolution";

const byDefinition = (f: Values, g: Values): number[] => {
	const result = f.map(() => 0);
	for (const [x, fx] of f.entries())
		for (const [y, gy] of g.entries()) result[x ^ y] = (result[x ^ y] ?? 0) + fx * gy;
	return result;
};

const byTransform = (f: Values, g: Values): number[] => {
	const transformedG = walshHadamard(g);
	const products = walshHadamard(f).map((value, index) => value * (transformedG[index] ?? 0));
	// Adding zero turns the −0 that dividing −0 leaves into 0, which toEqual tells apart.
	return walshHadamard(products).map((value) => value / f.length + 0);
};

/** Every table of four values from −3 to 3 whose code in base 7 is a multiple of the stride. */
const sampleTables = (stride: number): Values[] =>
	Array.from({ length: Math.ceil(7 ** 4 / stride) }, (_, step) =>
		inputs.map((position) => (Math.floor((step * stride) / 7 ** position) % 7) - 3),
	);

describe("pairsWithXor", () => {
	it("pairs every x with the one y that gives z", () => {
		expect(pairsWithXor(0b10, 4)).toEqual([
			{ x: 0, y: 2 },
			{ x: 1, y: 3 },
			{ x: 2, y: 0 },
			{ x: 3, y: 1 },
		]);
		expect(pairsWithXor(0, 4).map(({ y }) => y)).toEqual([0, 1, 2, 3]);
		expect(pairsWithXor(3, 4).map(({ y }) => y)).toEqual([3, 2, 1, 0]);
	});
});

describe("xorConvolution", () => {
	it("convolves the default tables", () => {
		expect(xorConvolution(defaults.f, defaults.g)).toEqual([5, 9, 3, 7]);
		expect(productsFor(defaults.f, defaults.g, 0b10)).toEqual([2, 0, 0, 1]);
		expect(productsFor(defaults.f, defaults.g, 0b01)).toEqual([1, 6, 0, 2]);
	});

	it("leaves a function alone when convolved with the point mass at 00", () => {
		expect(xorConvolution([2, -1, 3, 0], [1, 0, 0, 0])).toEqual([2, -1, 3, 0]);
		expect(xorConvolution([2, -1, 3, 0], [0, 0, 1, 0])).toEqual([3, 0, 2, -1]);
	});

	it("agrees with the definition and with the transform route", () => {
		const tables = sampleTables(97);
		expect(tables).toHaveLength(25);
		expect(tables[1]).toEqual([3, 3, -2, -3]);
		for (const f of tables) {
			for (const g of tables) {
				const result = xorConvolution(f, g);
				expect(result).toEqual(byDefinition(f, g));
				expect(result).toEqual(byTransform(f, g));
			}
		}
	});

	it("is the transform route on the default tables, step by step", () => {
		expect(walshHadamard(defaults.f)).toEqual([4, -2, 2, 0]);
		expect(walshHadamard(defaults.g)).toEqual([6, 4, 2, 0]);
		expect(walshHadamard([24, -8, 4, 0])).toEqual([20, 36, 12, 28]);
		expect(byTransform(defaults.f, defaults.g)).toEqual([5, 9, 3, 7]);
	});
});

describe("stepped", () => {
	it("moves one value and leaves the table it was given alone", () => {
		expect(stepped(defaults.f, 2, 1)).toEqual([1, 2, 1, 1]);
		expect(stepped(defaults.g, 3, -1)).toEqual([3, 1, 2, -1]);
		expect(defaults.f).toEqual([1, 2, 0, 1]);
	});

	it("stays between −3 and 3", () => {
		expect(stepped(defaults.g, 0, 1)).toBe(defaults.g);
		expect(stepped([-3, 0, 0, 0], 0, -1)).toEqual([-3, 0, 0, 0]);
		expect(canStep(3, 1)).toBe(false);
		expect(canStep(3, -1)).toBe(true);
		expect(canStep(-3, -1)).toBe(false);
		expect(canStep(-3, 1)).toBe(true);
	});
});

describe("text", () => {
	it("labels inputs as two bits", () => {
		expect(inputs.map(inputLabel)).toEqual(["00", "01", "10", "11"]);
		expect(resultName(2)).toBe("(f ∗ g)(10)");
	});

	it("writes out the sum for one z", () => {
		expect(sumExpression(defaults.f, defaults.g, 0b10)).toBe("1·2 + 2·0 + 0·3 + 1·1 = 3");
		expect(sumExpression(defaults.f, defaults.g, 0b01)).toBe("1·1 + 2·3 + 0·0 + 1·2 = 9");
		expect(sumExpression([1, 2, 1, 1], [3, 1, 2, -1], 0b10)).toBe("1·2 + 2·(−1) + 1·3 + 1·1 = 4");
		expect(sumExpression([-3, -3, -3, -3], [-3, -3, -3, -3], 0)).toBe(
			"(−3)·(−3) + (−3)·(−3) + (−3)·(−3) + (−3)·(−3) = 36",
		);
	});
});
