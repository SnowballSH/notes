import { minusSign } from "../../quantum/format.ts";
import { hadamardSign } from "./matrix.ts";

/** Cells of a finer matrix are too small on the board for lines between them to help. */
export const finestGridLevel = 3;

/** The lines between the cells of the matrix of this level, in a square whose side is its order. */
export function gridPath(level: number): string {
	if (level > finestGridLevel) return "";
	const order = 2 ** level;
	const inner = Array.from({ length: order - 1 }, (_, index) => index + 1);
	return [
		...inner.map((column) => `M${column} 0V${order}`),
		...inner.map((row) => `M0 ${row}H${order}`),
	].join("");
}

/** Cells of a finer matrix are too small on the board to hold their entry as a number. */
export const finestEntryLevel = 2;

export interface EntryLabel {
	x: number;
	y: number;
	text: string;
	negative: boolean;
}

/** The entries of the matrix of this level, each at the centre of its cell. */
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
