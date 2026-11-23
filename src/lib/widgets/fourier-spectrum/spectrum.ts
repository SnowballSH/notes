import { formatAmplitude, formatDyadic, minusSign } from "../../quantum/format.ts";
import { fourierCoefficients } from "../../quantum/fourier.ts";

const variables = 3;

export type Sign = 1 | -1;

// Input number k has x_i = -1 exactly when bit i of k, counted from the most significant, is 1.
export type TruthTable = readonly Sign[];

export const inputSigns = (index: number): Sign[] =>
	Array.from({ length: variables }, (_, position) =>
		(index >> (variables - 1 - position)) & 1 ? -1 : 1,
	);

const formatSign = (sign: number): string => (sign < 0 ? minusSign : "+");

export const inputLabel = (index: number): string => inputSigns(index).map(formatSign).join(" ");

export const tableOf = (f: (x1: Sign, x2: Sign, x3: Sign) => number): TruthTable =>
	Array.from({ length: 2 ** variables }, (_, index) => {
		const [x1 = 1, x2 = 1, x3 = 1] = inputSigns(index);
		return f(x1, x2, x3) < 0 ? -1 : 1;
	});

export const presetNames = ["and", "or", "majority", "parity", "first-bit"] as const;

export type PresetName = (typeof presetNames)[number];

// In the sign encoding -1 is true, so AND is -1 only when every input is.
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

const transformIndex = (subset: readonly number[]): number =>
	subset.reduce((mask, variable) => mask | (1 << (variables - variable)), 0);

export const subsetLabel = (subset: readonly number[]): string =>
	subset.length === 0 ? "∅" : `{${subset.join(",")}}`;

export const coefficientSymbol = "f\u0302(S)";

const subscripts = ["₀", "₁", "₂", "₃"];

export const monomial = (subset: readonly number[]): string =>
	subset.map((variable) => `x${subscripts[variable] ?? variable}`).join("");

interface Coefficient {
	subset: readonly number[];
	value: number;
}

export function spectrum(table: TruthTable): Coefficient[] {
	const coefficients = fourierCoefficients(table);
	return subsets.map((subset) => ({ subset, value: coefficients[transformIndex(subset)] ?? 0 }));
}

function formatTerm({ subset, value }: Coefficient): string {
	const magnitude = formatDyadic(Math.abs(value));
	if (subset.length === 0) return magnitude;
	return magnitude === "1" ? monomial(subset) : `${magnitude} ${monomial(subset)}`;
}

export function polynomialTerms(coefficients: readonly Coefficient[]): string[] {
	const nonzero = coefficients.filter(({ value }) => formatAmplitude(value) !== "0");
	if (nonzero.length === 0) return ["0"];
	return nonzero.map((coefficient, position) => {
		const term = formatTerm(coefficient);
		if (position > 0) return `${formatSign(coefficient.value)} ${term}`;
		return coefficient.value < 0 ? `${minusSign}${term}` : term;
	});
}

export const describeSpectrum = (coefficients: readonly Coefficient[]): string =>
	coefficients
		.map(({ subset, value }) => `${subsetLabel(subset)} ${formatAmplitude(value)}`)
		.join(", ");
