export interface OutlineSection {
	title: string;
	summary: string;
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
