import { error } from "@sveltejs/kit";
import { noteNavigation } from "#lib/server/site/courses.ts";
import { TypstError } from "#lib/server/typst/cli.ts";
import { hasNote, printNote, publishedNotes } from "#lib/server/typst/notes.ts";
import { building, dev } from "$app/env";
import type { EntryGenerator, RequestHandler } from "./$types";

export const prerender = true;

export const entries: EntryGenerator = () => publishedNotes();

/** The PDF edition of a note, at the note's address with `.pdf` added. */
export const GET: RequestHandler = async ({ params }) => {
	if (!(await hasNote(params))) error(404, "Not Found");
	const { course, number } = await noteNavigation(params, { showDrafts: dev });
	const note = await printNote(params, { courseTitle: course?.title ?? null, number });
	if (note.meta.draft && !dev) error(404, "Not Found");
	if (building && note.warnings.length > 0) {
		throw new TypstError(`Typst warned about this note's PDF:\n${note.warnings.join("\n\n")}`);
	}
	return new Response(note.pdf, { headers: { "content-type": "application/pdf" } });
};
