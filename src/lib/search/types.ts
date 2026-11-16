/** One thing a reader can jump to: a note, a section of one, or a numbered card in one. */
export interface SearchEntry {
	label: string;
	/** Where the entry is, shown beside it: the course for a note, the note for anything inside one. */
	context: string;
	href: string;
	kind: "note" | "section" | "card";
}
