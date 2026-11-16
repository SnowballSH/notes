/** An address a label took from the heading or card that would otherwise have had it. */
export interface Displacement {
	label: string;
	/** What lost the address, as an author would name it: `the section "Parity"`, `Theorem 2`. */
	owner: string;
}

/**
 * The ids in use on a page. Headings and unlabelled cards claim theirs here, and get the
 * next free one when theirs is taken; a claim that a label had taken is recorded.
 */
export class Addresses {
	readonly displacements: Displacement[] = [];
	private readonly taken: Set<string>;
	private readonly labels: ReadonlySet<string>;

	constructor(taken: Iterable<string>, labels: Iterable<string>) {
		this.taken = new Set(taken);
		this.labels = new Set(labels);
	}

	claim(wanted: string, owner: string): string {
		let id = wanted;
		for (let copy = 2; this.taken.has(id); copy++) {
			if (this.labels.has(id)) this.displacements.push({ label: id, owner });
			id = `${wanted}-${copy}`;
		}
		this.taken.add(id);
		return id;
	}
}
