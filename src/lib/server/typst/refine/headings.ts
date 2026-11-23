import type { NoteHeading } from "#lib/notes/types.ts";
import type { Addresses } from "./addresses";
import { attribute, elementsNamed, type ParentNode, setAttribute, textOf } from "./dom";

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

export function identifyHeadings(root: ParentNode, addresses: Addresses): NoteHeading[] {
	return elementsNamed(root, ...Object.keys(levels)).map((heading) => {
		const text = textOf(heading).trim();
		const id = attribute(heading, "id") ?? addresses.claim(slug(text), `the section "${text}"`);
		setAttribute(heading, "id", id);
		return { id, text, level: levels[heading.tagName] ?? 2 };
	});
}
