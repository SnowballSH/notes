import {
	attribute,
	type ChildNode,
	createElement,
	type Element,
	elementsNamed,
	isElement,
	isText,
	type ParentNode,
	siblings,
	splitText,
	textOf,
	wrap,
} from "./dom";

const unbreakableClass = "nobreak";
const proofEndMark = "\u25a1";

const isInlineMath = (node: ChildNode | undefined): node is Element =>
	isElement(node) && node.tagName === "math" && attribute(node, "display") !== "block";

const inlineElements = new Set(["a", "b", "code", "em", "i", "math", "span", "strong"]);

const isInlineElement = (node: ChildNode | undefined): node is Element =>
	isElement(node) && inlineElements.has(node.tagName);

const isBlank = (node: ChildNode | undefined): boolean => isText(node) && node.value.trim() === "";

function isLastContent(node: ChildNode): boolean {
	const following = node.parentNode?.childNodes ?? [];
	return following.slice(following.indexOf(node) + 1).every(isBlank);
}

const isProofEnd = (node: ChildNode | undefined): node is Element =>
	isInlineMath(node) && textOf(node) === proofEndMark && isLastContent(node);

function leadingText(node: ChildNode): ChildNode | undefined {
	const { previous } = siblings(node);
	if (!isText(previous)) return undefined;
	const start = previous.value.search(/\S+$/u);
	return start < 0 ? undefined : splitText(previous, start).tail;
}

function trailingText(node: ChildNode): ChildNode | undefined {
	const { next } = siblings(node);
	if (!isText(next)) return undefined;
	const length = /^\S+/u.exec(next.value)?.[0].length ?? 0;
	return length === 0 ? undefined : splitText(next, length).head;
}

function proofEndAfter(node: ChildNode): ChildNode[] {
	const { next } = siblings(node);
	if (isProofEnd(next)) return [next];
	if (!isBlank(next) || !next) return [];
	const mark = siblings(next).next;
	return isProofEnd(mark) ? [next, mark] : [];
}

function lastWordBefore(node: ChildNode): ChildNode[] {
	const { previous } = siblings(node);
	if (isInlineElement(previous)) return [previous];
	if (!isText(previous)) return [];
	if (isBlank(previous)) {
		const beforeSpace = siblings(previous).previous;
		return isInlineElement(beforeSpace) ? [beforeSpace, previous] : [];
	}
	const start = previous.value.search(/\S+\s*$/u);
	const word = start < 0 ? undefined : splitText(previous, start).tail;
	return word ? [word] : [];
}

function keepTogether(nodes: ChildNode[]): void {
	if (nodes.length > 1) wrap(nodes, createElement("span", { class: unbreakableClass }));
}

function isKeptTogether(node: ChildNode): boolean {
	const parent = node.parentNode ?? undefined;
	return isElement(parent) && attribute(parent, "class") === unbreakableClass;
}

export function keepMathWithAttachedText(root: ParentNode): void {
	for (const formula of elementsNamed(root, "math").filter(isInlineMath)) {
		if (isKeptTogether(formula)) continue;
		if (isProofEnd(formula)) {
			keepTogether([...lastWordBefore(formula), formula]);
			continue;
		}
		const before = leadingText(formula);
		const after = trailingText(formula);
		const run = [...(before ? [before] : []), formula, ...(after ? [after] : [])];
		keepTogether([...run, ...proofEndAfter(run.at(-1) ?? formula)]);
	}
}
