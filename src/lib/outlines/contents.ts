import { noteHref, notePath } from "#lib/notes/names.ts";
import type { NoteLink, NoteNeighbours } from "#lib/notes/types.ts";
import type { NotesOutline, OutlineSection } from "./types.ts";

export type SectionState = "written" | "draft" | "planned";

export interface ContentsSection {
	number: string;
	title: string;
	summary: string;
	state: SectionState;
	href: string | null;
}

export type LinkedSection = ContentsSection & { href: string };

export interface ContentsPart {
	number: number;
	title: string;
	sections: ContentsSection[];
}

export interface OutlinedCourse {
	slug: string;
	outline: NotesOutline;
}

export interface NoteStatus {
	slug: string;
	draft: boolean;
	title?: string;
}

export interface ContentsOptions {
	showDrafts: boolean;
}

export interface NotePlace extends NoteNeighbours {
	number: string;
}

export class OutlineError extends Error {}

export const outlineFile = (course: string): string => `src/lib/outlines/${course}.ts`;

export const sectionNumber = (partIndex: number, sectionIndex: number): string =>
	`${partIndex + 1}.${sectionIndex + 1}`;

interface NumberedSection extends OutlineSection {
	number: string;
}

const numberedSections = (outline: NotesOutline): NumberedSection[] =>
	outline.chapters.flatMap((chapter, partIndex) =>
		chapter.sections.map((section, sectionIndex) => ({
			...section,
			number: sectionNumber(partIndex, sectionIndex),
		})),
	);

export function outlineProblems(
	{ slug: course, outline }: OutlinedCourse,
	notes: readonly NoteStatus[],
): string[] {
	const file = outlineFile(course);
	const existing = new Map(notes.map((note) => [note.slug, note]));
	const sections = numberedSections(outline);
	const namedBy = new Map<string, string>();

	const fromSections = sections.flatMap(({ note, number, title }) => {
		if (note === undefined) return [];
		const earlier = namedBy.get(note);
		if (earlier !== undefined) {
			return `${file}: sections ${earlier} and ${number} both name the note "${note}"; name it in one section only`;
		}
		namedBy.set(note, number);
		const found = existing.get(note);
		const differs = (other: string) => other.trim() !== title.trim();
		if (found?.title !== undefined && !found.draft && differs(found.title)) {
			return `${notePath({ course, slug: note })} is titled "${found.title}", but section ${number} of ${file} is titled "${title}"; give them the same title, since the note shows one and the links to it show the other`;
		}
		if (found) return [];
		return `${file}: section ${number} "${title}" names the note "${note}", but ${notePath({ course, slug: note })} does not exist; create it with pnpm run new:note ${course} ${note} <title>, or remove note: "${note}" from the section`;
	});

	const fromNotes = notes
		.filter((note) => !note.draft && !namedBy.has(note.slug))
		.map(
			({ slug }) =>
				`${notePath({ course, slug })} is published, but no section of ${file} names it; add note: "${slug}" to its section there, or add draft: true to the note's header`,
		);

	return [...fromSections, ...fromNotes];
}

export function courseContents(
	course: OutlinedCourse,
	notes: readonly NoteStatus[],
	{ showDrafts }: ContentsOptions,
): ContentsPart[] {
	const problems = outlineProblems(course, notes);
	if (problems.length > 0) throw new OutlineError(problems.join("\n"));
	const drafts = new Set(notes.filter((note) => note.draft).map((note) => note.slug));

	const shown = ({ note }: OutlineSection): Pick<ContentsSection, "state" | "href"> => {
		if (note === undefined) return { state: "planned", href: null };
		const draft = drafts.has(note);
		if (draft && !showDrafts) return { state: "planned", href: null };
		return {
			state: draft ? "draft" : "written",
			href: noteHref({ course: course.slug, slug: note }),
		};
	};

	return course.outline.chapters.map((chapter, partIndex) => ({
		number: partIndex + 1,
		title: chapter.title,
		sections: chapter.sections.map((section, sectionIndex) => ({
			number: sectionNumber(partIndex, sectionIndex),
			title: section.title,
			summary: section.summary,
			...shown(section),
		})),
	}));
}

export const allSections = (parts: readonly ContentsPart[]): ContentsSection[] =>
	parts.flatMap((part) => part.sections);

const isLinked = (section: ContentsSection): section is LinkedSection => section.href !== null;

export const readingOrder = (parts: readonly ContentsPart[]): LinkedSection[] =>
	allSections(parts).filter(isLinked);

export const noteLink = (link: NoteLink | undefined): NoteLink | null =>
	link ? { title: link.title, href: link.href, number: link.number } : null;

export function notePlace(parts: readonly ContentsPart[], href: string): NotePlace | null {
	const order = readingOrder(parts);
	const index = order.findIndex((section) => section.href === href);
	const section = order[index];
	if (!section) return null;
	return {
		number: section.number,
		previous: noteLink(order[index - 1]),
		next: noteLink(order[index + 1]),
	};
}
