export interface OutlineSection {
	title: string;
	summary: string;
	/** The slug of the note that covers this section, `notes/<course>/<note>.typ`, once it is started. */
	note?: string;
}

export interface OutlineChapter {
	title: string;
	sections: OutlineSection[];
}

export interface OutlineSource {
	work: string;
	chapters: string;
}

export interface NotesOutline {
	title: string;
	description: string;
	chapters: OutlineChapter[];
	sources: OutlineSource[];
}
