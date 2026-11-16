import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type {
	CompiledNote,
	NoteLink,
	NoteMeta,
	NoteNeighbours,
	NoteRef,
} from "#lib/notes/types.ts";
import { widgetNames } from "#lib/widgets/registry.ts";
import { compileHtml, queryOne, TypstError } from "./cli";
import { refineNoteHtml } from "./refine";

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

const metaByFile = new Map<string, { modified: number; meta: Promise<NoteMeta> }>();

/** A note's metadata, read again only when its file has changed. */
async function readMeta(ref: NoteRef): Promise<NoteMeta> {
	const file = sourcePath(ref);
	const modified = (await stat(file)).mtimeMs;
	const cached = metaByFile.get(file);
	if (cached?.modified === modified) return cached.meta;
	const meta = queryOne(notesRoot, file, "<note-meta>").then((value) => parseMeta(value, file));
	metaByFile.set(file, { modified, meta });
	meta.catch(() => metaByFile.delete(file));
	return meta;
}

const hrefOf = ({ course, slug }: NoteRef): string => `/${course}/${slug}`;

/** The notes of one course in reading order, which is that of their `order` metadata. */
export async function courseNotes(course: string): Promise<(NoteRef & NoteLink)[]> {
	const refs = (await listNotes()).filter((note) => note.course === course);
	const notes = await Promise.all(
		refs.map(async (ref) => ({ ...ref, meta: await readMeta(ref), href: hrefOf(ref) })),
	);
	notes.sort((a, b) => a.meta.order - b.meta.order);
	const tied = notes.find((note, index) => note.meta.order === notes[index + 1]?.meta.order);
	if (tied) {
		throw new TypstError(`${course}: two notes have order ${tied.meta.order}; it must be unique`);
	}
	return notes.map(({ meta, ...note }) => ({ ...note, title: meta.title }));
}

export async function noteNeighbours(ref: NoteRef): Promise<NoteNeighbours> {
	const notes = await courseNotes(ref.course);
	const index = notes.findIndex((note) => note.slug === ref.slug);
	if (index < 0) throw new TypstError(`${sourcePath(ref)}: not a note of ${ref.course}`);
	const link = (note: NoteLink | undefined): NoteLink | null =>
		note ? { title: note.title, href: note.href } : null;
	return { previous: link(notes[index - 1]), next: link(notes[index + 1]) };
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
	const [{ stdout: document, warnings }, meta] = await Promise.all([
		compileHtml(notesRoot, file),
		readMeta(ref),
	]);
	const { html, headings } = refineNoteHtml(extract(document, /<body>([\s\S]*)<\/body>/, file));
	assertKnownWidgets(html, file);
	return {
		...ref,
		meta,
		html,
		headings,
		warnings,
		styles: /<style>([\s\S]*?)<\/style>/.exec(document)?.[1] ?? "",
	};
}
