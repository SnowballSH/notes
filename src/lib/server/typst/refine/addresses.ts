export interface Displacement {
	label: string;
	owner: string;
}

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
