import type { NoteCard } from "#lib/notes/types.ts";
import type { Addresses } from "./addresses";
import {
	addClass,
	append,
	attribute,
	type ChildNode,
	childElements,
	createElement,
	descendants,
	type Element,
	elementsNamed,
	hasClass,
	type ParentNode,
	replace,
	setAttribute,
	setText,
	textOf,
} from "./dom";

const labelledMark = "data-labelled";

// Typst gives a card an id only when its own note refers to it, so notes.typ wraps each labelled card in div[data-label].
export function adoptLabels(root: ParentNode): string[] {
	return elementsNamed(root, "div").flatMap((wrapper) => {
		const label = attribute(wrapper, "data-label");
		const [card, ...others] = childElements(wrapper);
		if (label === undefined || !card || others.length > 0) return [];
		setAttribute(card, "id", label);
		setAttribute(card, labelledMark, "");
		replace(wrapper, card);
		return [label];
	});
}

const isCard = (element: Element): boolean => hasClass(element, "card");

function cardName(card: Element): string | undefined {
	const heading = childElements(card).find((child) =>
		["header", "summary"].includes(child.tagName),
	);
	const name = heading && childElements(heading).find((child) => child.tagName === "strong");
	return name ? textOf(name).trim() : undefined;
}

const idFrom = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function anchorTo(id: string, name: string): Element {
	const anchor = createElement("a", { href: `#${id}`, "aria-label": `Link to ${name}` });
	addClass(anchor, "anchor");
	setText(anchor, "#");
	return anchor;
}

const noBreakSpace = "\u00a0";

function appendAnchor(target: Element, id: string, name: string): void {
	const space: ChildNode = { nodeName: "#text", value: noBreakSpace, parentNode: null };
	append(target, space, anchorTo(id, name));
}

// Runs after adoptLabels, so that a labelled card keeps its label as its id.
export function addAnchors(root: ParentNode, addresses: Addresses): NoteCard[] {
	const cards = descendants(root)
		.filter(isCard)
		.flatMap((card) => {
			const name = cardName(card);
			const heading = childElements(card)[0];
			if (!name || !heading) return [];
			const labelled = attribute(card, labelledMark) !== undefined;
			card.attrs = card.attrs.filter((attr) => attr.name !== labelledMark);
			const id = attribute(card, "id") ?? addresses.claim(idFrom(name), name);
			setAttribute(card, "id", id);
			const title = textOf(heading)
				.replace(name, "")
				.trim()
				.replace(/^\((.*)\)$/, "$1");
			appendAnchor(heading, id, name);
			return [{ id, name, title, labelled }];
		});
	for (const heading of elementsNamed(root, "h2", "h3")) {
		const id = attribute(heading, "id");
		if (id) appendAnchor(heading, id, `the section ${textOf(heading).trim()}`);
	}
	return cards;
}
