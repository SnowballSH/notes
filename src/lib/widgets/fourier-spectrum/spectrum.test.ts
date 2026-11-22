import { describe, expect, it } from "vitest";
import {
	describeSpectrum,
	flipped,
	formatPolynomial,
	inputLabel,
	inputSigns,
	matchingPreset,
	monomial,
	polynomialTerms,
	presetNames,
	presets,
	type Sign,
	spectrum,
	subsetLabel,
	subsets,
	type TruthTable,
	tableOf,
} from "./spectrum";

const values = (table: TruthTable): number[] => spectrum(table).map(({ value }) => value);

const everyTable = (): TruthTable[] =>
	Array.from({ length: 256 }, (_, code) =>
		Array.from({ length: 8 }, (_, input): Sign => ((code >> input) & 1 ? -1 : 1)),
	);

describe("inputs", () => {
	it("reads an input number as three signs, x1 first", () => {
		expect(inputSigns(0)).toEqual([1, 1, 1]);
		expect(inputSigns(1)).toEqual([1, 1, -1]);
		expect(inputSigns(4)).toEqual([-1, 1, 1]);
		expect(inputLabel(1)).toBe("+ + −");
		expect(inputLabel(7)).toBe("− − −");
	});
});

describe("presets", () => {
	it("has the truth tables of the named functions", () => {
		expect(presets.and.table).toEqual([1, 1, 1, 1, 1, 1, 1, -1]);
		expect(presets.or.table).toEqual([1, -1, -1, -1, -1, -1, -1, -1]);
		expect(presets.majority.table).toEqual([1, 1, 1, -1, 1, -1, -1, -1]);
		expect(presets.parity.table).toEqual([1, -1, -1, 1, -1, 1, 1, -1]);
		expect(presets["first-bit"].table).toEqual([1, 1, 1, 1, -1, -1, -1, -1]);
	});

	it("recognises a table as a preset until a value is flipped", () => {
		for (const name of presetNames) expect(matchingPreset(presets[name].table)).toBe(name);
		expect(matchingPreset(flipped(presets.majority.table, 0))).toBeUndefined();
	});
});

describe("flipped", () => {
	it("negates one value and leaves the table it was given alone", () => {
		const table = presets.and.table;
		expect(flipped(table, 7)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
		expect(flipped(flipped(table, 3), 3)).toEqual(table);
		expect(table[7]).toBe(-1);
	});
});

describe("spectrum", () => {
	it("lists the subsets by size", () => {
		expect(subsets.map(subsetLabel)).toEqual([
			"∅",
			"{1}",
			"{2}",
			"{3}",
			"{1,2}",
			"{1,3}",
			"{2,3}",
			"{1,2,3}",
		]);
	});

	it("gives majority 1/2 on each singleton and −1/2 on {1,2,3}", () => {
		expect(values(presets.majority.table)).toEqual([0, 0.5, 0.5, 0.5, 0, 0, 0, -0.5]);
		expect(formatPolynomial(spectrum(presets.majority.table))).toBe(
			"f = 1/2 x₁ + 1/2 x₂ + 1/2 x₃ − 1/2 x₁x₂x₃",
		);
	});

	it("gives the AND of the first two bits the expansion in the notes", () => {
		const and2 = tableOf((x1, x2) => Math.max(x1, x2));
		expect(values(and2)).toEqual([0.5, 0.5, 0.5, 0, -0.5, 0, 0, 0]);
		expect(formatPolynomial(spectrum(and2))).toBe("f = 1/2 + 1/2 x₁ + 1/2 x₂ − 1/2 x₁x₂");
	});

	it("gives the AND of three bits 3/4 and quarters", () => {
		expect(values(presets.and.table)).toEqual([0.75, 0.25, 0.25, 0.25, -0.25, -0.25, -0.25, 0.25]);
		expect(formatPolynomial(spectrum(presets.and.table))).toBe(
			"f = 3/4 + 1/4 x₁ + 1/4 x₂ + 1/4 x₃ − 1/4 x₁x₂ − 1/4 x₁x₃ − 1/4 x₂x₃ + 1/4 x₁x₂x₃",
		);
	});

	it("gives OR the expansion of AND with the even-sized subsets negated", () => {
		expect(values(presets.or.table)).toEqual([-0.75, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25]);
		expect(polynomialTerms(spectrum(presets.or.table))[0]).toBe("−3/4");
	});

	it("puts a parity function on its own subset alone", () => {
		expect(values(presets.parity.table)).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
		expect(formatPolynomial(spectrum(presets.parity.table))).toBe("f = x₁x₂x₃");
		expect(values(presets["first-bit"].table)).toEqual([0, 1, 0, 0, 0, 0, 0, 0]);
		expect(formatPolynomial(spectrum(presets["first-bit"].table))).toBe("f = x₁");
		expect(formatPolynomial(spectrum(tableOf((_, x2, x3) => -x2 * x3)))).toBe("f = −x₂x₃");
		expect(formatPolynomial(spectrum(tableOf(() => -1)))).toBe("f = −1");
	});

	it("matches the average of f times the parity function on every subset", () => {
		for (const table of [presets.majority.table, presets.and.table, flipped(presets.or.table, 5)]) {
			const averages = subsets.map((subset) => {
				const products = table.map((value, input) => {
					const signs = inputSigns(input);
					return subset.reduce((product, variable) => product * (signs[variable - 1] ?? 1), value);
				});
				return products.reduce((sum, product) => sum + product, 0) / table.length;
			});
			expect(values(table)).toEqual(averages);
		}
	});

	it("has squared coefficients that sum to 1 for all 256 functions", () => {
		for (const table of everyTable()) {
			const weight = values(table).reduce((sum, value) => sum + value ** 2, 0);
			expect(weight).toBe(1);
		}
	});

	it("evaluates back to the function at every input", () => {
		for (const table of everyTable()) {
			const coefficients = spectrum(table);
			const evaluated = table.map((_, input) => {
				const signs = inputSigns(input);
				return coefficients.reduce(
					(sum, { subset, value }) =>
						sum +
						value * subset.reduce((product, variable) => product * (signs[variable - 1] ?? 1), 1),
					0,
				);
			});
			expect(evaluated).toEqual(table);
		}
	});
});

describe("formatting", () => {
	it("writes monomials with subscripts", () => {
		expect(monomial([1, 3])).toBe("x₁x₃");
		expect(monomial([])).toBe("");
	});

	it("names every coefficient for a screen reader", () => {
		expect(describeSpectrum(spectrum(presets.majority.table))).toBe(
			"∅ 0, {1} +1/2, {2} +1/2, {3} +1/2, {1,2} 0, {1,3} 0, {2,3} 0, {1,2,3} −1/2",
		);
	});
});
