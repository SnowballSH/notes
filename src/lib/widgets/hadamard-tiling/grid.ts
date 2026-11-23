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
