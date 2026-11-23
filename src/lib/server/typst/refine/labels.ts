import type { Displacement } from "./addresses";

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
