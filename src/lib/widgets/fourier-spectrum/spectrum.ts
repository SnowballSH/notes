import { formatAmplitude, formatDyadic, minusSign } from "../../quantum/format.ts";
import { fourierCoefficients } from "../../quantum/fourier.ts";

export const variables = 3;

export type Sign = 1 | -1;

/**
 * The values of a function on the eight inputs. Input number k has x_i = -1 exactly when
 * bit i of k, counted from the most significant, is 1; so input 1 is (+, +, −).
 */
export type TruthTable = readonly Sign[];

export const inputSigns = (index: number): Sign[] =>
	Array.from({ length: variables }, (_, position) =>
		(index >> (variables - 1 - position)) & 1 ? -1 : 1,
	);

export const formatSign = (sign: number): string => (sign < 0 ? minusSign : "+");

export const inputLabel = (index: number): string => inputSigns(index).map(formatSign).join(" ");

export const formatValue = (value: Sign): string => formatAmplitude(value);

export const tableOf = (f: (x1: Sign, x2: Sign, x3: Sign) => number): TruthTable =>
	Array.from({ length: 2 ** variables }, (_, index) => {
		const [x1 = 1, x2 = 1, x3 = 1] = inputSigns(index);
		return f(x1, x2, x3) < 0 ? -1 : 1;
	});

export const presetNames = ["and", "or", "majority", "parity", "first-bit"] as const;

export type PresetName = (typeof presetNames)[number];

/** In the sign encoding -1 is true, so AND is -1 only when every input is. */
export const presets: Readonly<Record<PresetName, { name: string; table: TruthTable }>> = {
	and: { name: "AND", table: tableOf((x1, x2, x3) => Math.max(x1, x2, x3)) },
	or: { name: "OR", table: tableOf((x1, x2, x3) => Math.min(x1, x2, x3)) },
	majority: { name: "Majority", table: tableOf((x1, x2, x3) => x1 + x2 + x3) },
	parity: { name: "Parity", table: tableOf((x1, x2, x3) => x1 * x2 * x3) },
	"first-bit": { name: "First bit", table: tableOf((x1) => x1) },
};

export const flipped = (table: TruthTable, index: number): TruthTable =>
	table.map((value, input) => (input === index ? (-value as Sign) : value));

const sameTable = (first: TruthTable, second: TruthTable): boolean =>
	first.every((value, index) => value === second[index]);

export const matchingPreset = (table: TruthTable): PresetName | undefined =>
	presetNames.find((name) => sameTable(presets[name].table, table));

/** The subsets of {1, 2, 3} in the order the chart shows them: by size, then in order. */
export const subsets: readonly (readonly number[])[] = [
	[],
	[1],
	[2],
	[3],
	[1, 2],
	[1, 3],
	[2, 3],
	[1, 2, 3],
];

/** Where a subset's coefficient sits in the transform: variable i is the bit that input numbers use for x_i. */
const transformIndex = (subset: readonly number[]): number =>
	subset.reduce((mask, variable) => mask | (1 << (variables - variable)), 0);

export const subsetLabel = (subset: readonly number[]): string =>
	subset.length === 0 ? "∅" : `{${subset.join(",")}}`;

const subscripts = ["₀", "₁", "₂", "₃"];

export const monomial = (subset: readonly number[]): string =>
	subset.map((variable) => `x${subscripts[variable] ?? variable}`).join("");

export interface Coefficient {
	subset: readonly number[];
	value: number;
}

/** The Fourier coefficient of the function on each subset, in the order of `subsets`. */
export function spectrum(table: TruthTable): Coefficient[] {
	const coefficients = fourierCoefficients(table);
	return subsets.map((subset) => ({ subset, value: coefficients[transformIndex(subset)] ?? 0 }));
}

function formatTerm({ subset, value }: Coefficient): string {
	const magnitude = formatDyadic(Math.abs(value));
	if (subset.length === 0) return magnitude;
	return magnitude === "1" ? monomial(subset) : `${magnitude} ${monomial(subset)}`;
}

/** The nonzero terms of the expansion, each after the first led by its + or −. */
export function polynomialTerms(coefficients: readonly Coefficient[]): string[] {
	const nonzero = coefficients.filter(({ value }) => formatAmplitude(value) !== "0");
	if (nonzero.length === 0) return ["0"];
	return nonzero.map((coefficient, position) => {
		const term = formatTerm(coefficient);
		if (position > 0) return `${formatSign(coefficient.value)} ${term}`;
		return coefficient.value < 0 ? `${minusSign}${term}` : term;
	});
}

export const formatPolynomial = (coefficients: readonly Coefficient[]): string =>
	`f = ${polynomialTerms(coefficients).join(" ")}`;

/** Every coefficient after the name of its subset, for a reader who cannot see the bars. */
export const describeSpectrum = (coefficients: readonly Coefficient[]): string =>
	coefficients
		.map(({ subset, value }) => `${subsetLabel(subset)} ${formatAmplitude(value)}`)
		.join(", ");
