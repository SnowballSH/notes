import {
	addClass,
	append,
	attribute,
	childElements,
	createElement,
	createMathElement,
	descendants,
	detach,
	type Element,
	elementsNamed,
	insertAfter,
	type ParentNode,
	replace,
	setAttribute,
	setText,
	textOf,
	wrap,
} from "./dom";

const spacingAccents: Readonly<Record<string, string>> = {
	"\u0300": "\u0060",
	"\u0301": "\u00b4",
	"\u0302": "\u02c6",
	"\u0303": "\u02dc",
	"\u0304": "\u00af",
	"\u0306": "\u02d8",
	"\u0307": "\u02d9",
	"\u0308": "\u00a8",
	"\u030a": "\u02da",
	"\u030c": "\u02c7",
};

const spacingArrows: Readonly<Record<string, string>> = {
	"\u20d6": "\u2190",
	"\u20d7": "\u2192",
};

const isAccented = (element: Element): boolean =>
	element.tagName === "mover" && attribute(element, "accent")?.toLowerCase() === "true";

/**
 * Typst writes an accent as a combining mark alone in an `<mo>`. Chromium gives that a
 * zero-width box and paints it beside its base or not at all, so it becomes the spacing
 * form of the same mark.
 */
export function useSpacingAccents(root: ParentNode): void {
	for (const accented of descendants(root).filter(isAccented)) {
		const [base, mark] = childElements(accented);
		if (!base || mark?.tagName !== "mo") continue;
		const combining = textOf(mark);
		const accent = spacingAccents[combining];
		const arrow = spacingArrows[combining];
		if (accent !== undefined) setText(mark, accent);
		if (arrow === undefined) continue;
		setText(mark, arrow);
		addClass(mark, "vector-arrow");
		if ([...textOf(base)].length === 1) setAttribute(mark, "stretchy", "false");
	}
}

const fences = new Set("()[]{}|\u2016\u2308\u2309\u230a\u230b\u27e8\u27e9");
const tallElements = new Set(["mfrac", "mtable", "munder", "munderover", "msqrt", "mroot"]);
const largeOperators = /[\u2211\u220f\u2210\u222b-\u2233\u22c0-\u22c3\u2a00-\u2a06]/u;

function isTall(element: Element): boolean {
	if (tallElements.has(element.tagName)) return true;
	if (element.tagName === "mover") return !isAccented(element);
	return element.tagName === "mo" && largeOperators.test(textOf(element));
}

/**
 * Chromium reserves room for a stretchy bracket to grow even when it has nothing tall to
 * grow around, which sets `f(x)` as `f ( x )`. A bracket with only ordinary symbols
 * beside it is marked as not stretchy; one around a fraction or a matrix still grows.
 */
export function fixFencesAroundShortContent(root: ParentNode): void {
	const tallContent = new Map<ParentNode, boolean>();
	for (const operator of elementsNamed(root, "mo")) {
		const parent = operator.parentNode;
		if (!parent || attribute(operator, "stretchy") !== undefined) continue;
		if (!fences.has(textOf(operator))) continue;
		if (!tallContent.has(parent)) tallContent.set(parent, descendants(parent).some(isTall));
		if (!tallContent.get(parent)) setAttribute(operator, "stretchy", "false");
	}
}

const primes = /^[\u2032-\u2034\u2057]+$/u;

const isPrime = (element: Element): boolean =>
	element.tagName === "mo" && primes.test(textOf(element));

function primed(base: Element, prime: Element): Element {
	const group = createMathElement("mrow");
	setAttribute(prime, "form", "postfix");
	setAttribute(prime, "lspace", "0em");
	setAttribute(prime, "rspace", "0em");
	append(group, base, prime);
	return group;
}

/**
 * Typst sets a prime as a superscript. The prime glyph is already drawn raised, so the
 * superscript shrinks and lifts it a second time into a speck far from its letter. It is
 * placed beside its base at full size instead.
 */
export function setPrimesBesideBase(root: ParentNode): void {
	for (const script of elementsNamed(root, "msup", "msubsup").reverse()) {
		const parts = childElements(script);
		const base = parts[0];
		const raised = parts.at(-1);
		if (!base || !raised || raised === base) continue;
		if (isPrime(raised) && script.tagName === "msup" && parts.length === 2) {
			replace(script, primed(base, raised));
		} else if (isPrime(raised) && parts.length === 3 && parts[1]) {
			const subscripted = createMathElement("msub");
			append(subscripted, primed(base, raised), parts[1]);
			replace(script, subscripted);
		} else if (raised.tagName === "mrow") {
			const [prime, ...rest] = childElements(raised);
			if (!prime || !isPrime(prime) || rest.length === 0) continue;
			append(script, primed(base, prime), ...parts.slice(1));
		}
	}
}

const relations = new Set([
	...",;=\u2260<>\u2264\u2265\u2248\u2261\u223c\u2245\u2254",
	..."\u2282\u2283\u2286\u2287\u2190\u2192\u21a6\u21d0\u21d2\u21d4",
]);
const binaryOperators = new Set("+\u2212\u00b1\u2213\u22c5\u00d7\u2295\u2227\u2228\u222a\u2229");
const longFormulaLength = 24;

const isInline = (math: Element): boolean => attribute(math, "display") !== "block";

const isOperatorIn = (term: Element | undefined, operators: Set<string>): boolean =>
	term?.tagName === "mo" && attribute(term, "form") !== "prefix" && operators.has(textOf(term));

/** The indices at which `terms` may be cut: after an operator that has a term on each side. */
function cutsAfter(terms: Element[], operators: Set<string>): number[] {
	const isBreak = (term: Element | undefined) =>
		isOperatorIn(term, relations) || isOperatorIn(term, binaryOperators);
	return terms.flatMap((term, index) => {
		const follows = terms[index + 1];
		const closesPiece = index > 0 && !isBreak(terms[index - 1]);
		return isOperatorIn(term, operators) && closesPiece && follows && !isBreak(follows)
			? [index + 1]
			: [];
	});
}

function keepInfix(operator: Element | undefined): void {
	if (operator?.tagName === "mo" && attribute(operator, "form") === undefined) {
		setAttribute(operator, "form", "infix");
	}
}

/**
 * No browser breaks a line inside a formula in a useful place: Chromium never does, and
 * Firefox does anywhere. A long inline formula is therefore cut into several formulas
 * with a break opportunity between them, so that a line can end there and nowhere else.
 * The cuts follow the relations and commas of the outermost level, or its binary
 * operators when it has none. The operator that ends a piece keeps the infix spacing it
 * had in the middle.
 */
export function splitLongInlineMath(root: ParentNode): void {
	for (const math of elementsNamed(root, "math").filter(isInline)) {
		if ([...textOf(math)].length <= longFormulaLength) continue;
		const [only, ...others] = childElements(math);
		if (only?.tagName === "mrow" && others.length === 0 && only.attrs.length === 0) {
			append(math, ...only.childNodes);
			detach(only);
		}
		const terms = childElements(math);
		const byRelation = cutsAfter(terms, relations);
		const cuts = byRelation.length > 0 ? byRelation : cutsAfter(terms, binaryOperators);
		let end = terms.length;
		for (const cut of cuts.reverse()) {
			const piece = createMathElement("math");
			piece.attrs = math.attrs.filter((attr) => attr.name !== "id").map((attr) => ({ ...attr }));
			insertAfter(math, piece);
			insertAfter(math, createElement("wbr"));
			append(piece, ...terms.slice(cut, end));
			keepInfix(terms[cut - 1]);
			end = cut;
		}
	}
}

const lettersWithTails = new Set(
	"fgjpqy\u03b2\u03b3\u03b6\u03b7\u03bc\u03be\u03c1\u03c6\u03c7\u03c8",
);

const hasTail = (element: Element): boolean =>
	element.tagName === "mi" && lettersWithTails.has(textOf(element).normalize("NFKD"));

/**
 * A subscript is placed below the lowest point of its base, so the tail of a letter such as
 * gamma, chi or f pushes its subscript down and away from it. Such a base is treated as
 * having no depth, which sets its subscript where the subscript of an x would go.
 */
export function tuckSubscriptsUnderTails(root: ParentNode): void {
	for (const script of elementsNamed(root, "msub", "msubsup")) {
		const [base] = childElements(script);
		if (!base || !hasTail(base)) continue;
		const flat = createMathElement("mpadded", { depth: "0" });
		replace(base, flat);
		append(flat, base);
	}
}

/** Firefox does not scroll a math element, so each display equation gets a wrapper that can. */
export function wrapDisplayEquations(root: ParentNode): void {
	for (const math of elementsNamed(root, "math").filter((math) => !isInline(math))) {
		wrap([math], createElement("div", { class: "equation" }));
	}
}

export function refineMath(root: ParentNode): void {
	useSpacingAccents(root);
	setPrimesBesideBase(root);
	fixFencesAroundShortContent(root);
	tuckSubscriptsUnderTails(root);
	splitLongInlineMath(root);
	wrapDisplayEquations(root);
}
