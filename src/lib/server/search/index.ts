import type { CompiledNote } from "#lib/notes/types.ts";
import type { SearchEntry } from "#lib/search/types.ts";
import { compileNote, publishedNotes } from "#lib/server/typst/notes.ts";
import { findCourse } from "#lib/site/courses.ts";

export function entriesOf(note: CompiledNote, courseTitle: string): SearchEntry[] {
	const href = `/${note.course}/${note.slug}`;
	const title = note.meta.title;
	return [
		{ label: title, context: courseTitle, href, kind: "note" },
		...note.headings.map(
			(heading): SearchEntry => ({
				label: heading.text,
				context: title,
				href: `${href}#${heading.id}`,
				kind: "section",
			}),
		),
		...note.cards.map(
			(card): SearchEntry => ({
				label: card.title === "" ? card.name : `${card.name}: ${card.title}`,
				context: title,
				href: `${href}#${card.id}`,
				kind: "card",
			}),
		),
	];
}

/** Everything a reader can jump to, across every published note. */
export async function searchIndex(): Promise<SearchEntry[]> {
	const notes = await Promise.all((await publishedNotes()).map(compileNote));
	return notes.flatMap((note) =>
		entriesOf(note, findCourse(note.course)?.outline.title ?? note.course),
	);
}
