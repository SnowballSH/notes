import { minusSign } from "../../quantum/format.ts";
import { hadamardSign } from "./matrix.ts";

export const finestGridLevel = 3;

export function gridPath(level: number): string {
	if (level > finestGridLevel) return "";
	const order = 2 ** level;
	const inner = Array.from({ length: order - 1 }, (_, index) => index + 1);
	return [
		...inner.map((column) => `M${column} 0V${order}`),
		...inner.map((row) => `M0 ${row}H${order}`),
	].join("");
}

const finestEntryLevel = 2;

interface EntryLabel {
	x: number;
	y: number;
	text: string;
	negative: boolean;
}

export function entryLabels(level: number): EntryLabel[] {
	if (level > finestEntryLevel) return [];
	const order = 2 ** level;
	return Array.from({ length: order * order }, (_, index) => {
		const row = Math.floor(index / order);
		const column = index % order;
		const negative = hadamardSign(row, column) === -1;
		return { x: column + 0.5, y: row + 0.5, text: negative ? `${minusSign}1` : "1", negative };
	});
}
