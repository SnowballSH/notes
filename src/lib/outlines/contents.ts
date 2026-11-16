import { noteHref } from "#lib/notes/names.ts";
import type { NoteLink, NoteNeighbours } from "#lib/notes/types.ts";
import type { NotesOutline, OutlineSection } from "./types.ts";

/** A draft section exists only while developing: the published site shows it as planned. */
export type SectionState = "written" | "draft" | "planned";

export interface ContentsSection {
	/** `<part>.<section>`, both counted from 1. */
	number: string;
	title: string;
	summary: string;
	state: SectionState;
	/** The address of the section's note; null exactly when the section is planned. */
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
}

export interface ContentsOptions {
	/** Whether a section whose note is a draft links to it, as it does while developing. */
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

/** What the author must fix before the outline and the notes of a course agree, one line each. */
export function outlineProblems(
	{ slug: course, outline }: OutlinedCourse,
	notes: readonly NoteStatus[],
): string[] {
	const file = outlineFile(course);
	const existing = new Set(notes.map((note) => note.slug));
	const sections = numberedSections(outline);
	const namedBy = new Map<string, string>();

	const fromSections = sections.flatMap(({ note, number, title }) => {
		if (note === undefined) return [];
		const earlier = namedBy.get(note);
		if (earlier !== undefined) {
			return `${file}: sections ${earlier} and ${number} both name the note "${note}"; name it in one section only`;
		}
		namedBy.set(note, number);
		if (existing.has(note)) return [];
		return `${file}: section ${number} "${title}" names the note "${note}", but notes/${course}/${note}.typ does not exist; create it with pnpm run new:note ${course} ${note} <title>, or remove note: "${note}" from the section`;
	});

	const fromNotes = notes
		.filter((note) => !note.draft && !namedBy.has(note.slug))
		.map(
			({ slug }) =>
				`notes/${course}/${slug}.typ is published, but no section of ${file} names it; add note: "${slug}" to its section there, or add draft: true to the note's header`,
		);

	return [...fromSections, ...fromNotes];
}

/**
 * The parts and sections of a course as the site shows them: numbered, and linked to the
 * notes that are written. Throws an OutlineError when the outline and the notes disagree.
 */
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

/** The sections a reader can open, in the order of the outline. */
export const readingOrder = (parts: readonly ContentsPart[]): LinkedSection[] =>
	allSections(parts).filter(isLinked);

const linkTo = (section: LinkedSection | undefined): NoteLink | null =>
	section ? { title: section.title, href: section.href, number: section.number } : null;

/** Where the note at an address sits in its course, or null when no linked section leads to it. */
export function notePlace(parts: readonly ContentsPart[], href: string): NotePlace | null {
	const order = readingOrder(parts);
	const index = order.findIndex((section) => section.href === href);
	const section = order[index];
	if (!section) return null;
	return {
		number: section.number,
		previous: linkTo(order[index - 1]),
		next: linkTo(order[index + 1]),
	};
}
