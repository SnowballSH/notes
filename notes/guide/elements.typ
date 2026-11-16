#import "/lib/notes.typ": *
#show: note.with(
  title: "Every element a note can use",
  summary: "A reference page for authors: each element, as it renders on the site.",
  order: 1,
  draft: true,
)

This page is a draft, so it is served by `pnpm run dev` and left out of the published site. Open `notes/guide/elements.typ` beside it to see the source of each element. `docs/writing-notes.md` explains the workflow.

= Text

A paragraph with *strong text*, _emphasis_, `inline code`, a #link("https://typst.app/docs")[link], and a footnote#footnote[Footnotes collect at the end of the page.]. Use _emphasis_ for a term where it is defined. #highlight[Highlighted text], #strike[struck text], super#super[script] and sub#sub[script] also work.

- A bullet list
  - with a nested item
- and a second item

+ A numbered list
+ with a second item

/ Term: A term list pairs a term with its description.
/ Another term: Each description is indented under its term.

#quote(block: true)[A block quotation is set apart with a rule down its side.]

= Math

Inline math such as $f : {-1, 1}^n -> RR$ sits in the sentence. A display equation gets its own line:
$
  hat(f)(S) = chevron.l f, chi_S chevron.r = 1/2^n sum_(x in {-1, 1}^n) f(x) chi_S (x).
$
Align a derivation with `&`, and give a reason in a second column:
$
  (a + b)^2 & = a^2 + 2 a b + b^2 & quad "(expanding)" \
            & >= 4 a b            & quad "(AM-GM)"
$
A display equation that is wider than the page scrolls sideways on its own.

= Cards

#definition(title: "Definition")[
  A _card_ is a numbered block. Its `title:` is optional.
] <def-card>

#theorem(title: "Theorem")[
  Give a card a label to refer to it, as in @def-card.
] <thm-card>

#proof[
  A proof is collapsed until the reader opens it. Pass `collapsed: false` to show it open. End it with a square. $square$
]

A card in another note is referenced with `noteref`, which writes the card's name and fails the build if the card is not there: #noteref("walsh-hadamard/boolean-functions", <thm-plancherel>) is in the first chapter. Inside one course the note's name alone is enough, as in `#noteref("boolean-functions", <thm-plancherel>)`, and a body gives other words: #noteref("walsh-hadamard/boolean-functions", <thm-plancherel>)[Parseval's identity].

#proposition[A proposition, without a title.]

#lemma(title: "Lemma")[A lemma.]

#example(title: "Example")[An example is outlined, without the fill of a statement.]

#example(title: "Collapsed example", collapsed: true)[
  Any card can be collapsible: pass `collapsed: true` or `collapsed: false`.
]

#solution[A solution is collapsed like a proof.]

#remark[A remark is an aside with a rule down its side.]

= Figures, tables and code

#figure(
  image(
    bytes("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 60'><rect width='120' height='60' fill='white'/><circle cx='60' cy='30' r='20' fill='#1e59b5'/></svg>"),
    format: "svg",
    width: 40%,
  ),
  caption: [A figure has a caption and can be referenced by its label.],
) <fig-example>

@fig-example is drawn on white, so it is dimmed slightly in the dark theme. Put several figures side by side with `gallery`:

#gallery(
  columns: 3,
  ..range(3).map(n => figure(
    image(
      bytes("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><rect width='60' height='60' fill='white'/><rect width='" + str(20 * (n + 1)) + "' height='60' fill='black'/></svg>"),
      format: "svg",
      width: 100%,
    ),
    caption: [$n = #n$],
    numbering: none,
  )),
)

#figure(
  table(
    columns: 3,
    table.header[$x$][$f(x)$][Notes],
    [$0$], [$1$], [the first row],
    [$1$], [$-1$], [the second row],
  ),
  caption: [A table inside a figure is centred and captioned.],
)

```python
def fwht(a):
    """In-place fast Walsh-Hadamard transform."""
    h = 1
    while h < len(a):
        for i in range(0, len(a), 2 * h):
            for j in range(i, i + h):
                a[j], a[j + h] = a[j] + a[j + h], a[j] - a[j + h]
        h *= 2
```

= Widgets

A widget is an interactive component. Its named arguments are its props, and its body is shown until it loads:

#widget("hadamard-tiling", start: 2, max: 4)[The interactive tiling needs JavaScript.]

`docs/widgets.md` explains how to write one.
