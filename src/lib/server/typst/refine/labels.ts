import type { Displacement } from "./addresses";

/**
 * What is wrong with the labels an author gave the cards of a note, one line each. A label
 * is a card's address, so it must be the only one, and must not take the address a section
 * heading or a numbered card would otherwise have: links to those would land on the card.
 */
export function labelProblems(
	labels: readonly string[],
	displacements: readonly Displacement[],
): string[] {
	const repeated = labels.filter((label, index) => labels.indexOf(label) !== index);
	return [
		...new Set([
			...repeated.map(
				(label) => `two cards have the label <${label}>; give each card its own label`,
			),
			...displacements.map(
				({ label, owner }) =>
					`the label <${label}> is the address ${owner} would have; rename the label`,
			),
		]),
	];
}
