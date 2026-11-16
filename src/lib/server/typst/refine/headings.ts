import type { NoteHeading } from "#lib/notes/types.ts";
import {
	attribute,
	descendants,
	elementsNamed,
	type ParentNode,
	setAttribute,
	textOf,
} from "./dom";

const levels: Readonly<Record<string, number>> = { h2: 2, h3: 3 };

function slug(text: string): string {
	const words = text
		.normalize("NFKD")
		.replace(/\p{M}+/gu, "")
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, "-")
		.replace(/^-+|-+$/g, "");
	return words === "" ? "section" : words;
}

function unused(wanted: string, taken: Set<string>): string {
	let id = wanted;
	for (let copy = 2; taken.has(id); copy++) id = `${wanted}-${copy}`;
	taken.add(id);
	return id;
}

/** Gives every section heading an id to link to, and returns the headings in order. */
export function identifyHeadings(root: ParentNode): NoteHeading[] {
	const taken = new Set(descendants(root).flatMap((element) => attribute(element, "id") ?? []));
	return elementsNamed(root, ...Object.keys(levels)).map((heading) => {
		const text = textOf(heading).trim();
		const id = attribute(heading, "id") ?? unused(slug(text), taken);
		setAttribute(heading, "id", id);
		return { id, text, level: levels[heading.tagName] ?? 2 };
	});
}
