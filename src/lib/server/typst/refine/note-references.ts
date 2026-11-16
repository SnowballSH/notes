import { parseFragment, serialize } from "parse5";
import {
	attribute,
	type Element,
	elementsNamed,
	type ParentNode,
	setAttribute,
	setText,
	textOf,
} from "./dom";

/** A reference a note makes to a labelled card of another note, as `noteref` wrote it. */
export interface NoteReference {
	note: string;
	target: string;
}

/** Where a reference leads and what to call it, such as "Theorem 2". */
export interface ReferenceTarget {
	href: string;
	name: string;
}

function referenceOf(link: Element): NoteReference | undefined {
	const note = attribute(link, "data-note");
	const target = attribute(link, "data-target");
	const isReference = (attribute(link, "class") ?? "").split(/\s+/).includes("noteref");
	return isReference && note !== undefined && target !== undefined ? { note, target } : undefined;
}

const referenceLinks = (root: ParentNode): { link: Element; reference: NoteReference }[] =>
	elementsNamed(root, "a").flatMap((link) => {
		const reference = referenceOf(link);
		return reference ? [{ link, reference }] : [];
	});

export const noteReferences = (html: string): NoteReference[] =>
	referenceLinks(parseFragment(html)).map(({ reference }) => reference);

const titles = new Set(["h2", "h3", "h4", "header", "summary"]);

/**
 * References that have no words of their own and sit in a section heading or a card's
 * title. Their text is only known after the page's list of sections and the search index
 * have been made, so they would be missing there.
 */
export function wordlessReferencesInTitles(html: string): NoteReference[] {
	return referenceLinks(parseFragment(html)).flatMap(({ link, reference }) => {
		const parent = link.parentNode;
		const inTitle = parent !== null && "tagName" in parent && titles.has(parent.tagName);
		return inTitle && textOf(link).trim() === "" ? [reference] : [];
	});
}

/**
 * Points each reference at its target. A reference the author gave no words is written as
 * the target's name, kept on one line like the references Typst writes.
 */
export function linkNoteReferences(
	html: string,
	targetOf: (reference: NoteReference) => ReferenceTarget,
): string {
	const fragment = parseFragment(html);
	for (const { link, reference } of referenceLinks(fragment)) {
		const { href, name } = targetOf(reference);
		setAttribute(link, "href", href);
		link.attrs = link.attrs.filter((attr) => !attr.name.startsWith("data-"));
		if (textOf(link).trim() === "") setText(link, name.replaceAll(" ", " "));
	}
	return serialize(fragment);
}
