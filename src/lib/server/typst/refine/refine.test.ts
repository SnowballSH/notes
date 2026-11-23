import { describe, expect, it } from "vitest";
import { refineNoteHtml as refineNote } from "./index";
import { linkNoteReferences, noteReferences, wordlessReferencesInTitles } from "./note-references";

const refineNoteHtml = (html: string): string => refineNote(html).html;

const math = (inner: string): string => `<math>${inner}</math>`;
const display = (inner: string): string => `<math display="block">${inner}</math>`;
const equation = (inner: string): string => `<div class="equation">${display(inner)}</div>`;

describe("accents", () => {
	it("replaces a combining accent with its spacing form", () => {
		const hat = math('<mover accent="true"><mi>f</mi><mo>̂</mo></mover>');
		expect(refineNoteHtml(hat)).toContain("<mo>ˆ</mo>");
	});

	it("draws a vector arrow as a fixed-size arrow over one letter", () => {
		const vector = math('<mover accent="true"><mi>x</mi><mo stretchy="true">⃗</mo></mover>');
		expect(refineNoteHtml(vector)).toContain('<mo stretchy="false" class="vector-arrow">→</mo>');
	});

	it("leaves the arrow stretchy over a longer base", () => {
		const vector = math(
			'<mover accent="true"><mrow><mi>A</mi><mi>B</mi></mrow><mo stretchy="true">⃗</mo></mover>',
		);
		expect(refineNoteHtml(vector)).toContain('<mo stretchy="true" class="vector-arrow">→</mo>');
	});

	it("leaves a mark it does not know and an operator that is not an accent", () => {
		const unknown = math('<mover accent="true"><mi>x</mi><mo>⃛</mo></mover>');
		const limit = math("<mover><mi>x</mi><mo>̂</mo></mover>");
		expect(refineNoteHtml(unknown)).toBe(unknown);
		expect(refineNoteHtml(limit)).toBe(limit);
	});
});

describe("primes", () => {
	const prime = '<mo form="postfix" lspace="0em" rspace="0em">\u2032</mo>';

	it("sets a prime beside its base instead of as a superscript", () => {
		expect(refineNoteHtml(math("<msup><mi>x</mi><mo>′</mo></msup>"))).toBe(
			math('<mrow><mi>x</mi><mo form="postfix" lspace="0em" rspace="0em">′</mo></mrow>'),
		);
	});

	it("keeps the subscript of a primed symbol", () => {
		expect(refineNoteHtml(math("<msubsup><mi>x</mi><mn>1</mn><mo>′</mo></msubsup>"))).toBe(
			math(
				'<msub><mrow><mi>x</mi><mo form="postfix" lspace="0em" rspace="0em">′</mo></mrow><mn>1</mn></msub>',
			),
		);
	});

	it("moves a prime that leads a superscript onto the base", () => {
		const squared = math('<msup><mi>A</mi><mrow><mo form="postfix">′</mo><mn>2</mn></mrow></msup>');
		expect(refineNoteHtml(squared)).toBe(
			math(
				'<msup><mrow><mi>A</mi><mo form="postfix" lspace="0em" rspace="0em">′</mo></mrow><mrow><mn>2</mn></mrow></msup>',
			),
		);
	});

	it("sets a prime beside an accented base", () => {
		const accented = math(
			'<msup><mover accent="true"><mi>x</mi><mo>\u02c6</mo></mover><mo>\u2032</mo></msup>',
		);
		expect(refineNoteHtml(accented)).toBe(
			math(`<mrow><mover accent="true"><mi>x</mi><mo>\u02c6</mo></mover>${prime}</mrow>`),
		);
	});

	it("handles a primed symbol inside the base of another prime", () => {
		const nested = math(
			"<msup><mrow><msup><mi>x</mi><mo>\u2032</mo></msup><mi>y</mi></mrow><mo>\u2032</mo></msup>",
		);
		expect(refineNoteHtml(nested)).toBe(
			math(`<mrow><mrow><mrow><mi>x</mi>${prime}</mrow><mi>y</mi></mrow>${prime}</mrow>`),
		);
	});

	it("moves a prime that leads the superscript of a subscripted symbol", () => {
		const scripted = math(
			"<msubsup><mi>x</mi><mn>1</mn><mrow><mo>\u2032</mo><mn>2</mn></mrow></msubsup>",
		);
		expect(refineNoteHtml(scripted)).toBe(
			math(`<msubsup><mrow><mi>x</mi>${prime}</mrow><mn>1</mn><mrow><mn>2</mn></mrow></msubsup>`),
		);
	});

	it("leaves an ordinary superscript", () => {
		const power = math("<msup><mi>x</mi><mn>2</mn></msup>");
		expect(refineNoteHtml(power)).toBe(power);
	});
});

describe("subscripts", () => {
	const flat = (letter: string): string => `<mpadded depth="0"><mi>${letter}</mi></mpadded>`;

	it("sets the subscript of a letter with a tail as it would for a letter without one", () => {
		expect(refineNoteHtml(math("<msub><mi>\u{1d6fe}</mi><mi>n</mi></msub>"))).toBe(
			math(`<msub>${flat("\u{1d6fe}")}<mi>n</mi></msub>`),
		);
		expect(refineNoteHtml(math("<msubsup><mi>\u{1d453}</mi><mn>0</mn><mn>2</mn></msubsup>"))).toBe(
			math(`<msubsup>${flat("\u{1d453}")}<mn>0</mn><mn>2</mn></msubsup>`),
		);
	});

	it("leaves letters without a tail, groups and superscripts alone", () => {
		for (const formula of [
			math("<msub><mi>\u{1d43b}</mi><mn>1</mn></msub>"),
			math("<msub><mrow><mi>\u{1d6fe}</mi><mi>x</mi></mrow><mn>1</mn></msub>"),
			math("<msup><mi>\u{1d6fe}</mi><mn>2</mn></msup>"),
		]) {
			expect(refineNoteHtml(formula)).toBe(formula);
		}
	});
});

describe("fences", () => {
	it("stops a bracket around short content from stretching", () => {
		expect(refineNoteHtml(math("<mi>f</mi><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow>"))).toBe(
			math(
				'<mi>f</mi><mrow><mo stretchy="false">(</mo><mi>x</mi><mo stretchy="false">)</mo></mrow>',
			),
		);
	});

	it.each([
		["a fraction", "<mfrac><mi>a</mi><mi>b</mi></mfrac>"],
		["a matrix", "<mtable><mtr><mtd><mn>1</mn></mtd></mtr></mtable>"],
		["a sum with limits", "<munderover><mo>∑</mo><mi>i</mi><mi>n</mi></munderover>"],
		[
			"a nested fraction",
			"<msup><mrow><mfrac><mi>a</mi><mi>b</mi></mfrac></mrow><mn>2</mn></msup>",
		],
		["an inline sum", "<msubsup><mo>∑</mo><mi>i</mi><mi>n</mi></msubsup>"],
	])("lets a bracket grow around %s", (_name, tall) => {
		const fenced = math(`<mrow><mo>(</mo>${tall}<mo>)</mo></mrow>`);
		expect(refineNoteHtml(fenced)).toBe(fenced);
	});

	it.each([
		["floor", "\u230a", "\u230b"],
		["ceiling", "\u2308", "\u2309"],
		["norm", "\u2016", "\u2016"],
		["angle", "\u27e8", "\u27e9"],
		["absolute value", "|", "|"],
	])("covers %s brackets", (_name, open, close) => {
		const refined = refineNoteHtml(
			math(`<mrow><mo>${open}</mo><mi>x</mi><mo>${close}</mo></mrow>`),
		);
		expect(refined.match(/stretchy="false"/g)).toHaveLength(2);
	});

	it("judges a bracket directly under the formula by the whole formula", () => {
		const short = refineNoteHtml(math("<mo>(</mo><mi>x</mi><mo>)</mo>"));
		const tall = math("<mo>(</mo><mi>x</mi><mo>)</mo><mfrac><mi>a</mi><mi>b</mi></mfrac>");
		expect(short.match(/stretchy="false"/g)).toHaveLength(2);
		expect(refineNoteHtml(tall)).toBe(tall);
	});

	it("respects a stretchy attribute that Typst set", () => {
		const fixed = math(
			'<mrow><mo stretchy="true">(</mo><mi>x</mi><mo stretchy="true">)</mo></mrow>',
		);
		expect(refineNoteHtml(fixed)).toBe(fixed);
	});

	it("treats an accent as short and other operators as not fences", () => {
		const accented = math(
			'<mrow><mo>(</mo><mover accent="true"><mi>x</mi><mo>ˆ</mo></mover><mo>+</mo><mi>y</mi><mo>)</mo></mrow>',
		);
		const refined = refineNoteHtml(accented);
		expect(refined).toContain('<mo stretchy="false">(</mo>');
		expect(refined).toContain("<mo>+</mo>");
	});
});

describe("long inline formulas", () => {
	const terms = (count: number): string =>
		Array.from({ length: count }, (_, index) => `<msub><mi>a</mi><mn>${index}</mn></msub>`).join(
			"<mo>+</mo>",
		);

	it("cuts a long formula after each outermost relation", () => {
		const refined = refineNoteHtml(math(`${terms(8)}<mo>=</mo>${terms(8)}<mo>=</mo><mn>0</mn>`));
		expect(refined.match(/<math>/g)).toHaveLength(3);
		expect(refined.match(/<mo form="infix">=<\/mo><\/math>/g)).toHaveLength(2);
		expect(refined.match(/<\/math><wbr><math>/g)).toHaveLength(2);
		expect(refined.replaceAll(/<\/?math>|<wbr>| form="infix"/g, "")).toBe(
			`${terms(8)}<mo>=</mo>${terms(8)}<mo>=</mo><mn>0</mn>`,
		);
	});

	it("does not cut inside a bracketed group, a short formula or a display equation", () => {
		const short = math("<mi>a</mi><mo>=</mo><mi>b</mi>");
		const block = display(`${terms(8)}<mo>=</mo>${terms(8)}`);
		const group = `<mrow><mo>[</mo>${terms(8)}<mo>=</mo>${terms(8)}<mo>]</mo></mrow>`;
		for (const formula of [math(`<mi>P</mi>${group}`), short, block]) {
			expect(refineNoteHtml(formula).match(/<math/g)).toHaveLength(1);
		}
	});

	it("looks inside a group that is the whole formula", () => {
		const refined = refineNoteHtml(math(`<mrow>${terms(8)}<mo>=</mo>${terms(8)}</mrow>`));
		expect(refined).toBe(`${math(`${terms(8)}<mo form="infix">=</mo>`)}<wbr>${math(terms(8))}`);
	});

	it("cuts after binary operators when there is no relation", () => {
		const refined = refineNoteHtml(math(terms(14)));
		expect(refined.match(/<mo form="infix">\+<\/mo><\/math><wbr><math>/g)).toHaveLength(13);
	});

	it("never leaves an operator alone in a piece", () => {
		const leading = refineNoteHtml(math(`<mo>=</mo>${terms(14)}<mo>=</mo><mn>0</mn>`));
		const adjacent = refineNoteHtml(math(`${terms(8)}<mo>,</mo><mo>=</mo>${terms(8)}`));
		expect(leading.startsWith(`<math><mo>=</mo>${terms(14)}`)).toBe(true);
		expect(leading.match(/<wbr>/g)).toHaveLength(1);
		expect(adjacent).not.toMatch(/<math>(<mo[^>]*>[^<]*<\/mo>)+<\/math>/);
		expect(adjacent).toContain("<mo>,</mo><mo>=</mo>");
	});

	it("keeps an id on the first piece only", () => {
		const refined = refineNoteHtml(
			`<math id="eq" class="k">${terms(8)}<mo>=</mo>${terms(8)}</math>`,
		);
		expect(refined.match(/id="eq"/g)).toHaveLength(1);
		expect(refined.match(/class="k"/g)).toHaveLength(2);
		expect(refined.startsWith('<math id="eq"')).toBe(true);
	});

	it("keeps a form that Typst set", () => {
		const refined = refineNoteHtml(
			math(`${terms(8)}<mo>=</mo><mo form="prefix">−</mo>${terms(8)}`),
		);
		expect(refined).toContain('<math><mo form="prefix">−</mo>');
	});
});

describe("text attached to formulas", () => {
	const x = math("<mi>x</mi>");
	const square = math("<mi>□</mi>");

	it("keeps punctuation on the line of the formula before it", () => {
		expect(refineNoteHtml(`<p>Let ${x}, so that</p>`)).toBe(
			`<p>Let <span class="nobreak">${x},</span> so that</p>`,
		);
	});

	it("keeps an opening bracket and a suffix with their formula", () => {
		expect(refineNoteHtml(`<p>the (${x})-th entry</p>`)).toBe(
			`<p>the <span class="nobreak">(${x})-th</span> entry</p>`,
		);
	});

	it("leaves a formula between spaces alone", () => {
		const spaced = `<p>Let ${x} be</p>`;
		expect(refineNoteHtml(spaced)).toBe(spaced);
	});

	it("keeps the end-of-proof square with the last word", () => {
		expect(refineNoteHtml(`<p>as desired. ${square}</p>`)).toBe(
			`<p>as <span class="nobreak">desired. ${square}</span></p>`,
		);
	});

	it("keeps the end-of-proof square with a final formula", () => {
		expect(refineNoteHtml(`<p>so ${x}. ${square}</p>`)).toBe(
			`<p>so <span class="nobreak">${x}. ${square}</span></p>`,
		);
	});

	it("does not treat a square in the middle of a paragraph as the end of a proof", () => {
		const middle = `<p>the symbol ${square} marks</p>`;
		expect(refineNoteHtml(middle)).toBe(middle);
	});

	it("keeps the end-of-proof square with an element before it", () => {
		expect(refineNoteHtml(`<p>as <em>desired</em> ${square} </p>`)).toBe(
			`<p>as <span class="nobreak"><em>desired</em> ${square}</span> </p>`,
		);
	});

	it("does not attach text to a display equation", () => {
		expect(refineNoteHtml(`${display("<mi>x</mi>")}<p>, where</p>`)).toBe(
			`${equation("<mi>x</mi>")}<p>, where</p>`,
		);
	});
});

describe("display equations", () => {
	it("are wrapped in a container that can scroll", () => {
		expect(refineNoteHtml(`<p>so</p>${display("<mi>x</mi>")}<p>where</p>`)).toBe(
			`<p>so</p>${equation("<mi>x</mi>")}<p>where</p>`,
		);
	});
});

describe("headings", () => {
	it("gives each section heading an id made from its text", () => {
		const { html, headings } = refineNote("<h2>Hadamard Matrix</h2><h3>The $2^n$ case!</h3>");
		expect(html).toContain('<h2 id="hadamard-matrix">Hadamard Matrix');
		expect(html).toContain('<h3 id="the-2-n-case">The $2^n$ case!');
		expect(headings).toEqual([
			{ id: "hadamard-matrix", text: "Hadamard Matrix", level: 2 },
			{ id: "the-2-n-case", text: "The $2^n$ case!", level: 3 },
		]);
	});

	it("keeps ids unique among headings and against ids anywhere in the note", () => {
		const { headings } = refineNote(
			'<h2>Proof</h2><h2>Proof</h2><h2>Lemma</h2><section id="lemma"></section><h2 id="own">Kept</h2>',
		);
		expect(headings.map((heading) => heading.id)).toEqual(["proof", "proof-2", "lemma-2", "own"]);
	});

	it("keeps letters of any script and falls back when a heading has none", () => {
		const { headings } = refineNote(
			"<h2>Na\u00efve bound</h2><h2>\u0394\u03bf\u03ba\u03b9\u03bc\u03ae</h2><h2>\u2211</h2><h2>\u220f</h2>",
		);
		expect(headings.map((heading) => heading.id)).toEqual([
			"naive-bound",
			"\u03b4\u03bf\u03ba\u03b9\u03bc\u03b7",
			"section",
			"section-2",
		]);
	});

	it("leaves deeper headings out", () => {
		const { html, headings } = refineNote("<h4>Deep</h4>");
		expect(html).toBe("<h4>Deep</h4>");
		expect(headings).toEqual([]);
	});

	it("reads the text of a heading that holds a formula", () => {
		const { headings } = refineNote(`<h2>Order ${math("<mi>n</mi>")} matrices</h2>`);
		expect(headings).toEqual([{ id: "order-n-matrices", text: "Order n matrices", level: 2 }]);
	});
});

describe("anchors", () => {
	const anchor = (id: string, name: string): string =>
		`&nbsp;<a href="#${id}" aria-label="Link to ${name}" class="anchor">#</a>`;

	it("names an unlabelled card after its kind and number, and links to it", () => {
		expect(
			refineNoteHtml(
				'<section class="card card-theorem"><header><strong>Theorem 3</strong> (Name)</header><p>Text</p></section>',
			),
		).toBe(
			`<section class="card card-theorem" id="theorem-3"><header><strong>Theorem 3</strong> (Name)${anchor("theorem-3", "Theorem 3")}</header><p>Text</p></section>`,
		);
	});

	it("keeps the label the author gave a card", () => {
		expect(
			refineNoteHtml(
				'<details class="card card-lemma" id="lem-a"><summary><strong>Lemma 1</strong></summary>Text</details>',
			),
		).toBe(
			`<details class="card card-lemma" id="lem-a"><summary><strong>Lemma 1</strong>${anchor("lem-a", "Lemma 1")}</summary>Text</details>`,
		);
	});

	it("makes the label the library passes along the id of the card, referenced or not", () => {
		const card = (id: string): string =>
			`<section${id} class="card card-lemma"><header><strong>Lemma 1</strong></header></section>`;
		const refined = refineNoteHtml(
			`<div data-label="lem-a">${card("")}</div><div id="lem-b" data-label="lem-b">${card("")}</div>`,
		);
		expect(refined).not.toContain("data-label");
		expect(refined).not.toContain("<div");
		expect(refined.match(/<section[^>]*>/g)).toEqual([
			'<section class="card card-lemma" id="lem-a">',
			'<section class="card card-lemma" id="lem-b">',
		]);
	});

	it("gives a card another id when its own is already on the page", () => {
		const html =
			'<p id="theorem-1"></p><section class="card card-theorem"><header><strong>Theorem 1</strong></header></section>';
		expect(refineNoteHtml(html)).toContain('<section class="card card-theorem" id="theorem-1-2">');
	});

	it("reports labels that repeat or take the address of a section or a numbered card", () => {
		const card = (kind: string, name: string, label?: string): string => {
			const section = `<section class="card card-${kind}"><header><strong>${name}</strong></header></section>`;
			return label === undefined ? section : `<div data-label="${label}">${section}</div>`;
		};
		const { problems } = refineNote(
			`<h2>Parity</h2>${card("lemma", "Lemma 1", "dup")}${card("lemma", "Lemma 2", "dup")}${card("lemma", "Lemma 3", "parity")}${card("theorem", "Theorem 1", "theorem-2")}${card("theorem", "Theorem 2")}`,
		);
		expect(problems).toEqual([
			"two cards have the label <dup>; give each card its own label",
			'the label <parity> is the address the section "Parity" would have; rename the label',
			"the label <theorem-2> is the address Theorem 2 would have; rename the label",
		]);
		expect(refineNote(`<h2>Parity</h2>${card("lemma", "Lemma 1", "lem-a")}`).problems).toEqual([]);
	});

	it("judges a clash by the address a section really has", () => {
		const card =
			'<div data-label="parity"><section class="card card-lemma"><header><strong>Lemma 1</strong></header></section></div>';
		expect(refineNote(`<h2 id="sec-parity">Parity</h2>${card}`).problems).toEqual([]);
		const second = card.replace("parity", "examples-2");
		expect(refineNote(`<h2>Examples</h2><h2>Examples</h2>${second}`).problems).toEqual([
			'the label <examples-2> is the address the section "Examples" would have; rename the label',
		]);
	});

	it("lets a card's label win over a section heading with the same slug", () => {
		const { html, headings, cards } = refineNote(
			'<h2>Lemma A</h2><div data-label="lemma-a"><section class="card card-lemma"><header><strong>Lemma 1</strong></header></section></div>',
		);
		expect(headings.map((heading) => heading.id)).toEqual(["lemma-a-2"]);
		expect(cards).toEqual([{ id: "lemma-a", name: "Lemma 1", title: "", labelled: true }]);
		expect(html).not.toContain("data-label");
	});

	it("links to a section heading without changing its listed text", () => {
		const { html, headings } = refineNote("<h2>Parity</h2>");
		expect(html).toBe(`<h2 id="parity">Parity${anchor("parity", "the section Parity")}</h2>`);
		expect(headings).toEqual([{ id: "parity", text: "Parity", level: 2 }]);
	});

	it("leaves proofs, which have no number, alone", () => {
		const proof = '<details class="proof"><summary><strong>Proof</strong></summary>Text</details>';
		expect(refineNoteHtml(proof)).toBe(proof);
	});
});

describe("images", () => {
	it("describes an image without a description by its caption", () => {
		expect(
			refineNoteHtml(
				'<figure><img src="a.png"><figcaption>The <em>first</em> matrix</figcaption></figure>',
			),
		).toBe(
			'<figure><img src="a.png" alt="The first matrix"><figcaption>The <em>first</em> matrix</figcaption></figure>',
		);
	});

	it("finds the caption when the image sits in a box inside its figure", () => {
		expect(
			refineNoteHtml('<figure><p><img src="a.png"></p><figcaption>n = 3</figcaption></figure>'),
		).toContain('<img src="a.png" alt="n = 3">');
	});

	it("marks an image with neither as one to pass over, and keeps a description that is given", () => {
		expect(refineNoteHtml('<p><img src="a.png"><img src="b.png" alt="A graph"></p>')).toBe(
			'<p><img src="a.png" alt=""><img src="b.png" alt="A graph"></p>',
		);
	});
});

describe("references to other notes", () => {
	const reference = (words = "") =>
		`<a class="noteref" data-note="sets" data-target="thm-a">${words}</a>`;
	const target = () => ({ href: "/course/sets#thm-a", name: "Theorem 2" });

	it("lists the references a note makes", () => {
		expect(noteReferences(`<p>${reference()} and <a href="#x">x</a></p>`)).toEqual([
			{ note: "sets", target: "thm-a" },
		]);
	});

	it("links a reference and names its target on one line", () => {
		expect(linkNoteReferences(`<p>By ${reference()}.</p>`, target)).toBe(
			'<p>By <a class="noteref" href="/course/sets#thm-a">Theorem&nbsp;2</a>.</p>',
		);
	});

	it("finds a reference without words in a heading or a card title, where its text would be lost", () => {
		expect(
			wordlessReferencesInTitles(`<h2>After ${reference()}</h2><p>${reference()}</p>`),
		).toEqual([{ note: "sets", target: "thm-a" }]);
		expect(wordlessReferencesInTitles(`<h2>After ${reference("the bound")}</h2>`)).toEqual([]);
		expect(
			wordlessReferencesInTitles(
				`<section><header>From <strong>${reference()}</strong></header></section>`,
			),
		).toHaveLength(1);
	});

	it("keeps the words the author gave", () => {
		expect(linkNoteReferences(reference("the bound"), target)).toBe(
			'<a class="noteref" href="/course/sets#thm-a">the bound</a>',
		);
	});
});

describe("widgets", () => {
	it("records the height of a widget that declares one", () => {
		expect(
			refineNoteHtml('<notes-widget name="hadamard-tiling" props="{}"></notes-widget>'),
		).toMatch(
			/^<notes-widget name="hadamard-tiling" props="{}" style="--widget-height: calc\([^"]+\)"><\/notes-widget>$/,
		);
	});

	it("leaves a widget without a declared height alone", () => {
		const widget = '<notes-widget name="parity-explorer" props="{}">fallback</notes-widget>';
		expect(refineNoteHtml(widget)).toBe(widget);
	});
});

describe("code", () => {
	it("turns the colours of Typst's syntax theme into token classes", () => {
		const code =
			'<pre><code data-lang="py"><span style="color: #d73948">def</span> <span style="color: #4b69c6">f</span>(): <span style="color: #74747c"># note</span></code></pre>';
		expect(refineNoteHtml(code)).toBe(
			'<pre><code data-lang="py"><span class="token-keyword">def</span> <span class="token-function">f</span>(): <span class="token-comment"># note</span></code></pre>',
		);
	});

	it("leaves a colour it does not know and coloured text outside code", () => {
		const html =
			'<code><span style="color: #123456">x</span></code><p><span style="color: #d73948">red</span></p>';
		expect(refineNoteHtml(html)).toBe(html);
	});
});

describe("unrelated markup", () => {
	it("keeps a code block that starts with a blank line", () => {
		const code = "<pre><code>\n\nfirst</code></pre>";
		expect(refineNoteHtml(code)).toBe(code);
	});

	it("is returned unchanged", () => {
		const html =
			'<details class="proof"><summary><strong>Proof</strong></summary><p>Text &amp; more <a href="#x">link</a>.</p></details><notes-widget name="w" props="{&quot;a&quot;:1}">fallback</notes-widget>';
		expect(refineNoteHtml(html)).toBe(html);
	});
});
