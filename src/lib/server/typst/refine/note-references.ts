import { parseFragment, serialize } from "parse5";
import {
	ancestors,
	attribute,
	type Element,
	elementsNamed,
	hasClass,
	type ParentNode,
	setAttribute,
	setText,
	textOf,
} from "./dom";

export interface NoteReference {
	note: string;
	target: string;
}

export interface ReferenceTarget {
	href: string;
	name: string;
}

function referenceOf(link: Element): NoteReference | undefined {
	const note = attribute(link, "data-note");
	const target = attribute(link, "data-target");
	const isReference = hasClass(link, "noteref");
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

const isInTitle = (link: Element): boolean =>
	ancestors(link).some((node) => titles.has(node.tagName));

// The text of these is filled in only after the page's contents and the search index have been made.
export function wordlessReferencesInTitles(html: string): NoteReference[] {
	return referenceLinks(parseFragment(html)).flatMap(({ link, reference }) =>
		isInTitle(link) && textOf(link).trim() === "" ? [reference] : [],
	);
}

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
