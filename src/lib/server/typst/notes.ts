import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { isName, noteHref } from "#lib/notes/names.ts";
import type {
	CompiledNote,
	NoteLink,
	NoteMeta,
	NoteNeighbours,
	NoteRef,
} from "#lib/notes/types.ts";
import type { NoteStatus } from "#lib/outlines/contents.ts";
import { compileHtml, queryOne, TypstError } from "./cli";
import { refineNoteHtml } from "./refine";
import { assertValidWidgets } from "./widgets";

const notesRoot = resolve("notes");
const libraryDirectory = "lib";

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
	if (!isName(ref.course) || !isName(ref.slug)) return false;
	return (await listNotes()).some((note) => note.course === ref.course && note.slug === ref.slug);
}

function parseMeta(value: unknown, file: string): NoteMeta {
	const { title, summary, order, draft } = value as Record<string, unknown>;
	if (typeof title !== "string" || title === "") {
		throw new TypstError(`${file}: the note needs a title`);
	}
	if (summary !== null && typeof summary !== "string") {
		throw new TypstError(`${file}: summary must be text`);
	}
	if (typeof order !== "number" || !Number.isInteger(order)) {
		throw new TypstError(`${file}: order must be an integer`);
	}
	if (typeof draft !== "boolean") {
		throw new TypstError(`${file}: draft must be true or false`);
	}
	return { title, summary, order, draft };
}

const metaByFile = new Map<string, { modified: number; meta: Promise<NoteMeta> }>();

/** A note's metadata, read again only when its file has changed. */
async function readMeta(ref: NoteRef): Promise<NoteMeta> {
	const file = sourcePath(ref);
	const modified = (await stat(file)).mtimeMs;
	const cached = metaByFile.get(file);
	if (cached?.modified === modified) return cached.meta;
	const meta = queryOne(notesRoot, file, "<note-meta>")
		.catch((cause: unknown) => {
			if (!String(cause).includes("expected exactly one element")) throw cause;
			throw new TypstError(`${file}: the note must start with #show: note.with(title: ..)`, {
				cause,
			});
		})
		.then((value) => parseMeta(value, file));
	metaByFile.set(file, { modified, meta });
	meta.catch(() => metaByFile.delete(file));
	return meta;
}

async function withMeta(refs: NoteRef[]): Promise<(NoteRef & { meta: NoteMeta })[]> {
	return Promise.all(refs.map(async (ref) => ({ ...ref, meta: await readMeta(ref) })));
}

/** Every note that is not a draft: the pages of the published site. */
export async function publishedNotes(): Promise<NoteRef[]> {
	const notes = await withMeta(await listNotes());
	return notes.filter((note) => !note.meta.draft).map(({ course, slug }) => ({ course, slug }));
}

async function notesOfCourse(course: string): Promise<(NoteRef & { meta: NoteMeta })[]> {
	return withMeta((await listNotes()).filter((note) => note.course === course));
}

/** Every note of one course and whether it is a draft, in no particular order. */
export async function courseNoteStatuses(course: string): Promise<NoteStatus[]> {
	return (await notesOfCourse(course)).map(({ slug, meta }) => ({ slug, draft: meta.draft }));
}

/**
 * The published notes of a course that has no outline, in reading order, which is that of
 * their `order` metadata.
 */
export async function notesByOrder(course: string): Promise<(NoteRef & NoteLink)[]> {
	const notes = (await notesOfCourse(course)).filter((note) => !note.meta.draft);
	notes.sort((a, b) => a.meta.order - b.meta.order);
	const tied = notes.findIndex((note, index) => note.meta.order === notes[index + 1]?.meta.order);
	if (tied >= 0) {
		const [first, second] = notes.slice(tied, tied + 2).map((note) => `${note.slug}.typ`);
		throw new TypstError(
			`notes/${course}: ${first} and ${second} both have order ${notes[tied]?.meta.order}; give each note its own`,
		);
	}
	return notes.map(({ meta, ...note }) => ({
		...note,
		title: meta.title,
		href: noteHref(note),
		number: null,
	}));
}

export async function neighboursByOrder(ref: NoteRef): Promise<NoteNeighbours> {
	const notes = await notesByOrder(ref.course);
	const index = notes.findIndex((note) => note.slug === ref.slug);
	if (index < 0) return { previous: null, next: null };
	const link = (note: NoteLink | undefined): NoteLink | null =>
		note ? { title: note.title, href: note.href, number: note.number } : null;
	return { previous: link(notes[index - 1]), next: link(notes[index + 1]) };
}

function extract(document: string, pattern: RegExp, file: string): string {
	const captured = pattern.exec(document)?.[1];
	if (captured === undefined) throw new TypstError(`${file}: unexpected Typst HTML output`);
	return captured;
}

export async function compileNote(ref: NoteRef): Promise<CompiledNote> {
	const file = sourcePath(ref);
	const [{ stdout: document, warnings }, meta] = await Promise.all([
		compileHtml(notesRoot, file),
		readMeta(ref),
	]);
	const { html, headings } = refineNoteHtml(extract(document, /<body>([\s\S]*)<\/body>/, file));
	assertValidWidgets(html, file);
	return {
		...ref,
		meta,
		html,
		headings,
		warnings,
		styles: /<style>([\s\S]*?)<\/style>/.exec(document)?.[1] ?? "",
	};
}
