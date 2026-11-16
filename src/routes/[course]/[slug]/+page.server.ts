import { error } from "@sveltejs/kit";
import { noteNavigation } from "#lib/server/site/courses.ts";
import { TypstError } from "#lib/server/typst/cli.ts";
import { compileNote, hasNote, publishedNotes } from "#lib/server/typst/notes.ts";
import { building, dev } from "$app/env";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const entries: EntryGenerator = () => publishedNotes();

export const load: PageServerLoad = async ({ params }) => {
	if (!(await hasNote(params))) error(404, "Not Found");
	const [note, navigation] = await Promise.all([
		compileNote(params),
		noteNavigation(params, { showDrafts: dev }),
	]);
	if (note.meta.draft && !dev) error(404, "Not Found");
	if (building && note.warnings.length > 0) {
		throw new TypstError(`Typst warned about this note:\n${note.warnings.join("\n\n")}`);
	}
	return { note, navigation };
};
