export type Random = () => number;

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
