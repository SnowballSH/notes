import { error } from "@sveltejs/kit";
import { compileNote, hasNote, listNotes } from "#lib/server/typst/notes.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const entries: EntryGenerator = () => listNotes();

export const load: PageServerLoad = async ({ params }) => {
	if (!(await hasNote(params))) error(404, "Not Found");
	return { note: await compileNote(params) };
};
