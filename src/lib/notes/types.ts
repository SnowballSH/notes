export interface NoteRef {
	course: string;
	slug: string;
}

export interface NoteMeta {
	title: string;
	summary: string | null;
	order: number;
}

export interface CompiledNote extends NoteRef {
	meta: NoteMeta;
	html: string;
	styles: string;
}
