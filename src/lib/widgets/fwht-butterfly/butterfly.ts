import { formatDyadic, minusSign } from "../../quantum/format.ts";
import type { Random } from "../../quantum/sampling.ts";

export const defaultInput: readonly number[] = [1, 1, 1, -1, 1, -1, -1, -1];
export const levels = Math.log2(defaultInput.length);

const smallest = -3;
const largest = 3;

/** An entry of the array as it stands after a level; level 0 is the input. */
export interface Node {
	level: number;
	index: number;
}

/** The two entries of the previous level that one entry is made from: upper + sign × lower. */
export interface Butterfly {
	upper: number;
	lower: number;
	sign: 1 | -1;
}

export interface Wire {
	level: number;
	from: number;
	to: number;
	sign: 1 | -1;
}

export const halfAt = (level: number): number => 2 ** (level - 1);

export function butterflyInto({ level, index }: Node): Butterfly {
	const half = halfAt(level);
	const upper = index & ~half;
	return { upper, lower: upper | half, sign: index === upper ? 1 : -1 };
}

/** The input, then the array after each pass of the fast Walsh-Hadamard transform. */
export function butterflyColumns(input: readonly number[]): number[][] {
	const columns = [[...input]];
	for (let level = 1; halfAt(level) < input.length; level++) {
		const previous = columns[level - 1] ?? [];
		columns.push(
			previous.map((_, index) => {
				const { upper, lower, sign } = butterflyInto({ level, index });
				return (previous[upper] ?? 0) + sign * (previous[lower] ?? 0);
			}),
		);
	}
	return columns;
}

export function wiresInto(node: Node): [Wire, Wire] {
	const { upper, lower, sign } = butterflyInto(node);
	return [
		{ level: node.level, from: upper, to: node.index, sign: 1 },
		{ level: node.level, from: lower, to: node.index, sign },
	];
}

export const allWires = (size: number): Wire[] =>
	Array.from({ length: Math.log2(size) }, (_, pass) =>
		Array.from({ length: size }, (_, index) => wiresInto({ level: pass + 1, index })),
	).flat(2);

export const formatValue = (value: number): string =>
	value < 0 ? `${minusSign}${formatDyadic(-value)}` : formatDyadic(value);

const formatOperand = (value: number): string =>
	value < 0 ? `(${formatValue(value)})` : formatValue(value);

export const columnName = (level: number): string =>
	level === 0 ? "input" : `half = ${halfAt(level)}`;

export const nodeId = ({ level, index }: Node): string => `${level}-${index}`;

export const nodeLabel = (node: Node, value: number): string =>
	`${node.level === 0 ? "Input" : `After ${columnName(node.level)}`}, f[${node.index}] = ${formatValue(value)}`;

export const describeLevel = (level: number): string =>
	level === 0
		? `Level 0 of ${levels}: the input.`
		: `After level ${level} of ${levels}: blocks of size ${2 * halfAt(level)} are transformed.`;

/** The line of the algorithm that set one entry, with the numbers it used. */
export function equation(columns: readonly (readonly number[])[], node: Node): string {
	const value = formatValue(columns[node.level]?.[node.index] ?? 0);
	if (node.level === 0) return `f[${node.index}] = ${value}`;
	const { upper, lower, sign } = butterflyInto(node);
	const previous = columns[node.level - 1] ?? [];
	const operator = sign === 1 ? "+" : minusSign;
	const names = `f[${upper}] ${operator} f[${lower}]`;
	const numbers = `${formatValue(previous[upper] ?? 0)} ${operator} ${formatOperand(previous[lower] ?? 0)}`;
	return `f[${node.index}] = ${names} = ${numbers} = ${value}`;
}

const clamp = (value: number, low: number, high: number): number =>
	Math.min(Math.max(value, low), high);

/** Where an arrow key takes the focus among the computed entries, if the key is an arrow. */
export function movedNode(
	{ level, index }: Node,
	key: string,
	computedLevel: number,
	size: number,
): Node | undefined {
	switch (key) {
		case "ArrowUp":
			return { level, index: clamp(index - 1, 0, size - 1) };
		case "ArrowDown":
			return { level, index: clamp(index + 1, 0, size - 1) };
		case "ArrowLeft":
			return { level: clamp(level - 1, 0, computedLevel), index };
		case "ArrowRight":
			return { level: clamp(level + 1, 0, computedLevel), index };
		default:
			return undefined;
	}
}

export const randomValues = (random: Random, count: number): number[] =>
	Array.from({ length: count }, () => smallest + Math.floor(random() * (largest - smallest + 1)));
