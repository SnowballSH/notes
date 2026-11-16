import { defaultTreeAdapter as adapter, html, type DefaultTreeAdapterTypes as Tree } from "parse5";

export type Element = Tree.Element;
export type TextNode = Tree.TextNode;
export type ChildNode = Tree.ChildNode;
export type ParentNode = Tree.ParentNode;

export const isElement = (node: Tree.Node | undefined): node is Element =>
	node !== undefined && adapter.isElementNode(node);

export const isText = (node: Tree.Node | undefined): node is TextNode =>
	node !== undefined && adapter.isTextNode(node);

export function descendants(root: ParentNode): Element[] {
	return root.childNodes.filter(isElement).flatMap((child) => [child, ...descendants(child)]);
}

export function elementsNamed(root: ParentNode, ...names: string[]): Element[] {
	return descendants(root).filter((element) => names.includes(element.tagName));
}

export const childElements = (parent: ParentNode): Element[] => parent.childNodes.filter(isElement);

export function textOf(node: ChildNode): string {
	if (isText(node)) return node.value;
	return isElement(node) ? node.childNodes.map(textOf).join("") : "";
}

export function attribute(element: Element, name: string): string | undefined {
	return element.attrs.find((attr) => attr.name === name)?.value;
}

export function setAttribute(element: Element, name: string, value: string): void {
	const existing = element.attrs.find((attr) => attr.name === name);
	if (existing) existing.value = value;
	else element.attrs.push({ name, value });
}

export function addClass(element: Element, name: string): void {
	const classes = (attribute(element, "class") ?? "").split(/\s+/).filter(Boolean);
	if (!classes.includes(name)) setAttribute(element, "class", [...classes, name].join(" "));
}

export function setText(element: Element, value: string): void {
	element.childNodes = [];
	adapter.insertText(element, value);
}

export function createElement(
	tagName: string,
	attrs: Record<string, string> = {},
	namespace: html.NS = html.NS.HTML,
): Element {
	return adapter.createElement(
		tagName,
		namespace,
		Object.entries(attrs).map(([name, value]) => ({ name, value })),
	);
}

export const createMathElement = (tagName: string, attrs: Record<string, string> = {}): Element =>
	createElement(tagName, attrs, html.NS.MATHML);

export function append(parent: ParentNode, ...nodes: ChildNode[]): void {
	for (const node of nodes) {
		if (node.parentNode) adapter.detachNode(node);
		adapter.appendChild(parent, node);
	}
}

export const detach = (node: ChildNode): void => adapter.detachNode(node);

export function replace(old: ChildNode, replacement: ChildNode): void {
	const parent = old.parentNode;
	if (!parent) throw new Error("cannot replace a detached node");
	adapter.insertBefore(parent, replacement, old);
	adapter.detachNode(old);
}

export function insertAfter(reference: ChildNode, node: ChildNode): void {
	const parent = reference.parentNode;
	if (!parent) throw new Error("cannot insert after a detached node");
	const following = siblings(reference).next;
	if (following) adapter.insertBefore(parent, node, following);
	else adapter.appendChild(parent, node);
}

/** Moves a run of adjacent siblings into `wrapper`, which takes their place. */
export function wrap(nodes: ChildNode[], wrapper: Element): void {
	const [first] = nodes;
	const parent = first?.parentNode;
	if (!first || !parent) throw new Error("cannot wrap detached nodes");
	adapter.insertBefore(parent, wrapper, first);
	append(wrapper, ...nodes);
}

export function siblings(node: ChildNode): { previous?: ChildNode; next?: ChildNode } {
	const nodes = node.parentNode?.childNodes ?? [];
	const index = nodes.indexOf(node);
	const previous = nodes[index - 1];
	const next = nodes[index + 1];
	return { ...(previous && { previous }), ...(next && { next }) };
}

/** Splits a text node at `offset` and returns the two halves, omitting an empty one. */
export function splitText(node: TextNode, offset: number): { head?: TextNode; tail?: TextNode } {
	if (offset <= 0) return { tail: node };
	if (offset >= node.value.length) return { head: node };
	const parent = node.parentNode;
	if (!parent) throw new Error("cannot split a detached text node");
	const tail: TextNode = { nodeName: "#text", value: node.value.slice(offset), parentNode: null };
	node.value = node.value.slice(0, offset);
	const following = siblings(node).next;
	if (following) adapter.insertBefore(parent, tail, following);
	else adapter.appendChild(parent, tail);
	return { head: node, tail };
}
