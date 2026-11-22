import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { isName, noteHref } from "#lib/notes/names.ts";
import { placeholderSummary } from "#lib/notes/template.ts";
import type {
	CompiledNote,
	NoteLink,
	NoteMeta,
	NoteNeighbours,
	NoteRef,
} from "#lib/notes/types.ts";
import type { NoteStatus } from "#lib/outlines/contents.ts";
import { siteOrigin } from "#lib/site/title.ts";
import { compileHtml, compilePdf, readMetadata, TypstError } from "./cli";
import { refineNoteHtml } from "./refine";
import {
	linkNoteReferences,
	type NoteReference,
	noteReferences,
	type ReferenceTarget,
	wordlessReferencesInTitles,
} from "./refine/note-references";
import { assertValidWidgets } from "./widgets";

const notesRoot = resolve("notes");
const libraryDirectory = "lib";

/** A note's source as error messages name it: relative to the repository. */
const shownPath = ({ course, slug }: NoteRef): string => `notes/${course}/${slug}.typ`;

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

export function parseMeta(headers: readonly unknown[], file: string): NoteMeta {
	const [value, ...others] = headers;
	if (value === undefined) {
		throw new TypstError(`${file}: the note must start with #show: note.with(title: ..)`);
	}
	if (others.length > 0) {
		throw new TypstError(
			`${file}: the note has ${headers.length} #show: note.with(..) headers; keep one`,
		);
	}
	const { title, summary, order, draft } = value as Record<string, unknown>;
	if (typeof title !== "string" || title.trim() === "") {
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
	if (!draft && summary === placeholderSummary) {
		throw new TypstError(`${file}: write the note's summary before publishing it`);
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
	const meta = readMetadata(notesRoot, file, "note-meta").then((value) =>
		parseMeta(value, shownPath(ref)),
	);
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
	return (await notesOfCourse(course)).map(({ slug, meta }) => ({
		slug,
		draft: meta.draft,
		title: meta.title,
	}));
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

/** Changes whenever a file the note may read does: the note's course directory and the library. */
async function sourceStamp(ref: NoteRef): Promise<string> {
	const directories = [join(notesRoot, ref.course), join(notesRoot, libraryDirectory)];
	const files = (
		await Promise.all(
			directories.map(async (directory) =>
				(await readdir(directory)).map((file) => join(directory, file)),
			),
		)
	).flat();
	const modified = await Promise.all(files.map(async (file) => (await stat(file)).mtimeMs));
	return modified.join(",");
}

const compiledByFile = new Map<string, { stamp: string; note: Promise<CompiledNote> }>();

async function compile(ref: NoteRef): Promise<CompiledNote> {
	const file = sourcePath(ref);
	const [{ stdout: document, warnings }, meta] = await Promise.all([
		compileHtml(notesRoot, file),
		readMeta(ref),
	]);
	const { problems, ...refined } = refineNoteHtml(
		extract(document, /<body>([\s\S]*)<\/body>/, shownPath(ref)),
	);
	if (problems.length > 0) {
		throw new TypstError(problems.map((problem) => `${shownPath(ref)}: ${problem}`).join("\n"));
	}
	assertValidWidgets(refined.html, shownPath(ref));
	return {
		...ref,
		meta,
		...refined,
		warnings,
		styles: /<style>([\s\S]*?)<\/style>/.exec(document)?.[1] ?? "",
	};
}

/** A note compiled to HTML, compiled again only when one of its sources has changed. */
async function compileSource(ref: NoteRef): Promise<CompiledNote> {
	const file = sourcePath(ref);
	const stamp = await sourceStamp(ref);
	const cached = compiledByFile.get(file);
	if (cached?.stamp === stamp) return cached.note;
	const note = compile(ref);
	compiledByFile.set(file, { stamp, note });
	note.catch(() => compiledByFile.delete(file));
	return note;
}

/** The note a `noteref` names: one of the same course, or `course/slug` for another course. */
function referencedNote(from: NoteRef, name: string): NoteRef {
	const parts = name.split("/");
	if (parts.length > 2 || !parts.every(isName)) {
		throw new TypstError(
			`${shownPath(from)}: noteref names "${name}"; write "<slug>" for a note of the same course or "<course>/<slug>", without a leading slash`,
		);
	}
	const [first, second] = parts;
	return second === undefined
		? { course: from.course, slug: first ?? "" }
		: { course: first ?? "", slug: second };
}

async function referenceTarget(
	from: CompiledNote,
	reference: NoteReference,
): Promise<ReferenceTarget> {
	const file = shownPath(from);
	const ref = referencedNote(from, reference.note);
	if (!(await hasNote(ref))) {
		throw new TypstError(
			`${file}: noteref names the note "${reference.note}", but ${shownPath(ref)} does not exist`,
		);
	}
	const target = await compileSource(ref);
	if (target.meta.draft && !from.meta.draft) {
		throw new TypstError(
			`${file}: noteref points into ${shownPath(ref)}, which is a draft; publish it first or make this note a draft`,
		);
	}
	const labelled = target.cards.filter((candidate) => candidate.labelled);
	const card = labelled.find((candidate) => candidate.id === reference.target);
	if (!card) {
		const labels = labelled.map((candidate) => `<${candidate.id}>`).join(", ");
		const has =
			labels === "" ? "no labelled cards" : `no card with that label; its labels are ${labels}`;
		throw new TypstError(
			`${file}: noteref points at <${reference.target}> in ${shownPath(ref)}, which has ${has}`,
		);
	}
	return { href: `${noteHref(ref)}#${card.id}`, name: card.name };
}

const referenceKey = ({ note, target }: NoteReference): string => `${note}#${target}`;

/** The card each `noteref` of a note points at, by the reference's note and label. */
async function referenceTargets(note: CompiledNote): Promise<Map<string, ReferenceTarget>> {
	const references = noteReferences(note.html);
	const outcomes = await Promise.allSettled(
		references.map(
			async (reference) =>
				[referenceKey(reference), await referenceTarget(note, reference)] as const,
		),
	);
	const failures = outcomes.flatMap((outcome) =>
		outcome.status === "rejected" ? [String(outcome.reason?.message ?? outcome.reason)] : [],
	);
	if (failures.length > 0) throw new TypstError([...new Set(failures)].join("\n"));
	return new Map(
		outcomes.flatMap((outcome) => (outcome.status === "fulfilled" ? [outcome.value] : [])),
	);
}

/** A note ready to serve: compiled, with its references to other notes resolved. */
export async function compileNote(ref: NoteRef): Promise<CompiledNote> {
	const note = await compileSource(ref);
	if (noteReferences(note.html).length === 0) return note;
	const [untitled] = wordlessReferencesInTitles(note.html);
	if (untitled) {
		throw new TypstError(
			`${shownPath(ref)}: a noteref in a heading or a card's title needs its own words: #noteref("${untitled.note}", <${untitled.target}>)[...]`,
		);
	}
	const targets = await referenceTargets(note);
	const html = linkNoteReferences(note.html, (reference) => {
		const target = targets.get(referenceKey(reference));
		if (!target) {
			throw new TypstError(`${shownPath(ref)}: unresolved noteref ${referenceKey(reference)}`);
		}
		return target;
	});
	return { ...note, html };
}

/** What the site knows about a note's place, for the pages of its PDF edition. */
export interface NotePlacement {
	courseTitle: string | null;
	number: string | null;
}

/** The inputs print.typ reads: the note's place on the site and where its `noteref`s lead. */
export async function printInputs(
	ref: NoteRef,
	{ courseTitle, number }: NotePlacement,
): Promise<Record<string, string>> {
	const targets = await referenceTargets(await compileSource(ref));
	const references = Object.fromEntries(
		[...targets].map(([key, { href, name }]) => [key, { href: `${siteOrigin}${href}`, name }]),
	);
	return {
		print: "true",
		site: siteOrigin,
		path: noteHref(ref),
		references: JSON.stringify(references),
		...(courseTitle !== null && { course: courseTitle }),
		...(number !== null && { number }),
	};
}

export interface PrintedNote {
	meta: NoteMeta;
	pdf: Uint8Array<ArrayBuffer>;
	warnings: string[];
}

/** A note's PDF edition: every proof shown, no widgets, and links that lead back to the site. */
export async function printNote(ref: NoteRef, placement: NotePlacement): Promise<PrintedNote> {
	const [meta, inputs] = await Promise.all([readMeta(ref), printInputs(ref, placement)]);
	const { stdout: pdf, warnings } = await compilePdf(notesRoot, sourcePath(ref), inputs);
	return { meta, pdf, warnings };
}
