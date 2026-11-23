import { formatSigned } from "../../quantum/format.ts";
import { bitstring } from "../../quantum/state.ts";

export type Values = readonly number[];

export const bits = 2;
export const inputs: readonly number[] = Array.from({ length: 2 ** bits }, (_, index) => index);
const smallest = -3;
const largest = 3;

export const defaults = {
	f: [1, 2, 0, 1],
	g: [3, 1, 2, 0],
} as const satisfies Record<string, Values>;

export const inputLabel = (index: number): string => bitstring(index, bits);

export const pairsWithXor = (z: number, size: number): { x: number; y: number }[] =>
	Array.from({ length: size }, (_, x) => ({ x, y: x ^ z }));

export const productsFor = (f: Values, g: Values, z: number): number[] =>
	pairsWithXor(z, f.length).map(({ x, y }) => (f[x] ?? 0) * (g[y] ?? 0));

const total = (terms: readonly number[]): number => terms.reduce((sum, term) => sum + term, 0);

export const xorConvolution = (f: Values, g: Values): number[] =>
	f.map((_, z) => total(productsFor(f, g, z)));

export const canStep = (value: number, change: number): boolean =>
	value + change >= smallest && value + change <= largest;

export const stepped = (values: Values, index: number, change: number): Values => {
	const value = values[index];
	return value === undefined || !canStep(value, change)
		? values
		: values.with(index, value + change);
};

const formatFactor = (value: number): string =>
	value < 0 ? `(${formatSigned(value)})` : formatSigned(value);

export const resultName = (z: number): string => `(f ∗ g)(${inputLabel(z)})`;

export function sumExpression(f: Values, g: Values, z: number): string {
	const terms = pairsWithXor(z, f.length).map(
		({ x, y }) => `${formatFactor(f[x] ?? 0)}·${formatFactor(g[y] ?? 0)}`,
	);
	return `${terms.join(" + ")} = ${formatSigned(total(productsFor(f, g, z)))}`;
}
