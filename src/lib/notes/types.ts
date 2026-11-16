export interface NoteRef {
	course: string;
	slug: string;
}

export interface NoteMeta {
	title: string;
	summary: string | null;
	order: number;
	/** A draft is served while developing and left out of the published site. */
	draft: boolean;
}

export interface NoteHeading {
	id: string;
	text: string;
	level: number;
}

/** A numbered card of a note, such as "Theorem 3" with the title "Plancherel and Parseval". */
export interface NoteCard {
	id: string;
	name: string;
	/** Empty when the card has no title. */
	title: string;
}

export interface CompiledNote extends NoteRef {
	meta: NoteMeta;
	html: string;
	headings: NoteHeading[];
	cards: NoteCard[];
	/** What Typst warned about, such as an element it left out of the page. */
	warnings: string[];
	styles: string;
}

export interface NoteLink {
	title: string;
	href: string;
	/** The note's number in its course's outline, such as 1.2; null for a course without one. */
	number: string | null;
}

export interface NoteNeighbours {
	previous: NoteLink | null;
	next: NoteLink | null;
}
