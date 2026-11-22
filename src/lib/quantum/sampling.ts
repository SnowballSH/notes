/** A source of uniform numbers in [0, 1), such as `Math.random`. */
export type Random = () => number;

/** Draws an index with the given probabilities, which sum to 1. */
export function sampleIndex(probabilities: readonly number[], random: Random): number {
	const point = random();
	let cumulative = 0;
	let lastPossible = 0;
	for (const [index, probability] of probabilities.entries()) {
		if (probability <= 0) continue;
		cumulative += probability;
		lastPossible = index;
		if (point < cumulative) return index;
	}
	return lastPossible;
}
