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
	setAttribute,
	setText,
	textOf,
} from "./dom";

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
 * its id; the others are named after their kind and number.
 */
export function addAnchors(root: ParentNode): void {
	const taken = new Set(descendants(root).flatMap((element) => attribute(element, "id") ?? []));
	for (const card of descendants(root).filter(isCard)) {
		const name = cardName(card);
		const heading = childElements(card)[0];
		if (!name || !heading) continue;
		const wanted = idFrom(name);
		const id = attribute(card, "id") ?? (taken.has(wanted) ? undefined : wanted);
		if (id === undefined) continue;
		taken.add(id);
		setAttribute(card, "id", id);
		appendAnchor(heading, id, name);
	}
	for (const heading of elementsNamed(root, "h2", "h3")) {
		const id = attribute(heading, "id");
		if (id) appendAnchor(heading, id, `the section ${textOf(heading).trim()}`);
	}
}
