import { formatSigned } from "../../quantum/format.ts";
import { bitstring } from "../../quantum/state.ts";

/** A function on bitstrings as its table of values, indexed by the bitstrings read as binary numbers. */
export type Values = readonly number[];

export const bits = 2;
export const inputs: readonly number[] = Array.from({ length: 2 ** bits }, (_, index) => index);
export const smallest = -3;
export const largest = 3;

export const defaults = {
	f: [1, 2, 0, 1],
	g: [3, 1, 2, 0],
} as const satisfies Record<string, Values>;

export const inputLabel = (index: number): string => bitstring(index, bits);

/** The pairs (x, y) with x xor y = z, one for each x. */
export const pairsWithXor = (z: number, size: number): { x: number; y: number }[] =>
	Array.from({ length: size }, (_, x) => ({ x, y: x ^ z }));

/** The products f(x) g(y) over the pairs with x xor y = z, in order of x. */
export const productsFor = (f: Values, g: Values, z: number): number[] =>
	pairsWithXor(z, f.length).map(({ x, y }) => (f[x] ?? 0) * (g[y] ?? 0));

const total = (terms: readonly number[]): number => terms.reduce((sum, term) => sum + term, 0);

/** The XOR convolution by its definition: (f ∗ g)(z) is the sum of f(x) g(y) over x xor y = z. */
export const xorConvolution = (f: Values, g: Values): number[] =>
	f.map((_, z) => total(productsFor(f, g, z)));

export const canStep = (value: number, change: number): boolean =>
	value + change >= smallest && value + change <= largest;

/** The table with one value moved by the change, or the same table if that would leave the range. */
export const stepped = (values: Values, index: number, change: number): Values => {
	const value = values[index];
	return value === undefined || !canStep(value, change)
		? values
		: values.with(index, value + change);
};

const formatFactor = (value: number): string =>
	value < 0 ? `(${formatSigned(value)})` : formatSigned(value);

export const resultName = (z: number): string => `(f ∗ g)(${inputLabel(z)})`;

/** The sum that defines one value of the convolution, such as 1·2 + 2·0 + 0·3 + 1·1 = 3 for z = 10. */
export function sumExpression(f: Values, g: Values, z: number): string {
	const terms = pairsWithXor(z, f.length).map(
		({ x, y }) => `${formatFactor(f[x] ?? 0)}·${formatFactor(g[y] ?? 0)}`,
	);
	return `${terms.join(" + ")} = ${formatSigned(total(productsFor(f, g, z)))}`;
}
