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

export const unbreakableClass = "nobreak";
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

/** The text glued to the front of `node`: the unspaced end of the text before it. */
function leadingText(node: ChildNode): ChildNode | undefined {
	const { previous } = siblings(node);
	if (!isText(previous)) return undefined;
	const start = previous.value.search(/\S+$/u);
	return start < 0 ? undefined : splitText(previous, start).tail;
}

/** The text glued to the back of `node`: the unspaced start of the text after it. */
function trailingText(node: ChildNode): ChildNode | undefined {
	const { next } = siblings(node);
	if (!isText(next)) return undefined;
	const length = /^\S+/u.exec(next.value)?.[0].length ?? 0;
	return length === 0 ? undefined : splitText(next, length).head;
}

/** A proof-end mark that follows `node` after nothing but spaces, with those spaces. */
function proofEndAfter(node: ChildNode): ChildNode[] {
	const { next } = siblings(node);
	if (isProofEnd(next)) return [next];
	if (!isBlank(next) || !next) return [];
	const mark = siblings(next).next;
	return isProofEnd(mark) ? [next, mark] : [];
}

/** What the proof-end mark should stay with: the last word before it, or the element it follows. */
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

const isKeptTogether = (node: ChildNode): boolean =>
	isElement(node.parentNode ?? undefined) &&
	attribute(node.parentNode as Element, "class") === unbreakableClass;

/**
 * A browser may break a line between a formula and the text that touches it, which
 * strands a comma or the end-of-proof square at the start of a line. Each formula is
 * wrapped with the text attached to it so that they stay on one line.
 */
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
