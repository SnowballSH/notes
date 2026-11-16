import { error } from "@sveltejs/kit";
import { TypstError } from "#lib/server/typst/cli.ts";
import { compileNote, hasNote, listNotes, noteNeighbours } from "#lib/server/typst/notes.ts";
import { findCourse } from "#lib/site/courses.ts";
import { building } from "$app/env";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const entries: EntryGenerator = () => listNotes();

export const load: PageServerLoad = async ({ params }) => {
	if (!(await hasNote(params))) error(404, "Not Found");
	const [note, neighbours] = await Promise.all([compileNote(params), noteNeighbours(params)]);
	if (building && note.warnings.length > 0) {
		throw new TypstError(`Typst warned about this note:\n${note.warnings.join("\n\n")}`);
	}
	const course = findCourse(params.course);
	return {
		note,
		neighbours,
		course: course ? { title: course.outline.title, href: course.href } : null,
	};
};
