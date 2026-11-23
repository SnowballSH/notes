export interface NoteRef {
	course: string;
	slug: string;
}

export interface NoteMeta {
	title: string;
	summary: string | null;
	order: number;
	draft: boolean;
}

export interface NoteHeading {
	id: string;
	text: string;
	level: number;
}

export interface NoteCard {
	id: string;
	name: string;
	title: string;
	labelled: boolean;
}

export interface CompiledNote extends NoteRef {
	meta: NoteMeta;
	html: string;
	headings: NoteHeading[];
	cards: NoteCard[];
	warnings: string[];
	styles: string;
}

export interface NoteLink {
	title: string;
	href: string;
	number: string | null;
}

export interface NoteNeighbours {
	previous: NoteLink | null;
	next: NoteLink | null;
}
