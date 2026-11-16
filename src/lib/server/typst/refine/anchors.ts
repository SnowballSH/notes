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
	type ParentNode,
	replace,
	setAttribute,
	setText,
	textOf,
} from "./dom";

/**
 * Typst gives a card an id only when the same note refers to it. The library wraps every
 * labelled card in a `div[data-label]`; the label becomes the card's id and the wrapper goes.
 * Returns the labels, in order, repeats included.
 */
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

const labelledMark = "data-labelled";

const isCard = (element: Element): boolean =>
	(attribute(element, "class") ?? "").split(/\s+/).includes("card");

/** The numbered name of a card, such as "Theorem 3", read from its heading. */
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

function appendAnchor(target: Element, id: string, name: string): void {
	const space: ChildNode = { nodeName: "#text", value: " ", parentNode: null };
	append(target, space, anchorTo(id, name));
}

/**
 * Gives every card an address and shows a link to it, and to each section heading, so that
 * a reader can point someone at "Theorem 3". A card the author labelled keeps its label as
 * its id; the others are named after their kind and number. Returns the cards, in order.
 * Labels must have been adopted first.
 */
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
