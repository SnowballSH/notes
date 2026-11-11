import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { CompiledNote, NoteMeta, NoteRef } from "$lib/notes/types";
import { widgetNames } from "$lib/widgets/registry";
import { compileHtml, queryOne, TypstError } from "./cli";

const notesRoot = resolve("notes");
const libraryDirectory = "lib";
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sourcePath({ course, slug }: NoteRef): string {
	return join(notesRoot, course, `${slug}.typ`);
}

export async function listNotes(): Promise<NoteRef[]> {
	const courses = (await readdir(notesRoot, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory() && entry.name !== libraryDirectory)
		.map((entry) => entry.name);
	const notes = await Promise.all(
		courses.map(async (course) =>
			(await readdir(join(notesRoot, course)))
				.filter((file) => file.endsWith(".typ"))
				.map((file) => ({ course, slug: file.slice(0, -".typ".length) })),
		),
	);
	return notes.flat();
}

export async function hasNote(ref: NoteRef): Promise<boolean> {
	if (!namePattern.test(ref.course) || !namePattern.test(ref.slug)) return false;
	return (await listNotes()).some((note) => note.course === ref.course && note.slug === ref.slug);
}

function parseMeta(value: unknown, file: string): NoteMeta {
	const { title, summary, order } = value as Record<string, unknown>;
	if (typeof title !== "string" || title === "") {
		throw new TypstError(`${file}: the note needs a title`);
	}
	if (summary !== null && typeof summary !== "string") {
		throw new TypstError(`${file}: summary must be text`);
	}
	if (typeof order !== "number" || !Number.isInteger(order)) {
		throw new TypstError(`${file}: order must be an integer`);
	}
	return { title, summary, order };
}

function extract(document: string, pattern: RegExp, file: string): string {
	const captured = pattern.exec(document)?.[1];
	if (captured === undefined) throw new TypstError(`${file}: unexpected Typst HTML output`);
	return captured;
}

function assertKnownWidgets(html: string, file: string): void {
	const used = [...html.matchAll(/<notes-widget\b[^>]*?\bname="([^"]*)"/g)].map(
		(match) => match[1] ?? "",
	);
	const unknown = used.filter((name) => !widgetNames.includes(name));
	if (unknown.length > 0) {
		throw new TypstError(`${file}: unknown widget ${unknown.join(", ")}`);
	}
}

export async function compileNote(ref: NoteRef): Promise<CompiledNote> {
	const file = sourcePath(ref);
	const [document, meta] = await Promise.all([
		compileHtml(notesRoot, file),
		queryOne(notesRoot, file, "<note-meta>"),
	]);
	const html = extract(document, /<body>([\s\S]*)<\/body>/, file);
	assertKnownWidgets(html, file);
	return {
		...ref,
		meta: parseMeta(meta, file),
		html,
		styles: /<style>([\s\S]*?)<\/style>/.exec(document)?.[1] ?? "",
	};
}
