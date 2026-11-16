# Notes system

A note is one Typst file, compiled to static HTML when the site builds. Notes
are files in git and render the same for every reader; anything interactive
runs in the browser as a widget. This is the prototype of that pipeline, with
`notes/walsh-hadamard/boolean-functions.typ` as its first page.

## Writing a note

`notes/<course>/<slug>.typ` is served at `/<course>/<slug>`. Adding a file adds
the page. Names are lowercase words joined by hyphens.

```typst
#import "/lib/notes.typ": *
#show: note.with(title: "Bitstrings", summary: "One line for search engines.", order: 1)

Plain text with $x + 0 = x$ inline and display math:
$ e * x = x * e = x $

#definition(title: "Bitstring")[...] <def-bitstring>
#proof[...]
#example(title: "XOR by hand", collapsed: true)[...]
See @def-bitstring.
#widget("parity-explorer", size: 4)[Shown until the widget loads.]
```

`notes/lib/notes.typ` provides:

| Function | Renders as |
|---|---|
| `definition`, `theorem`, `proposition`, `lemma`, `example`, `remark` | A numbered card. `title:` is optional; `collapsed: true` or `false` makes it collapsible. A label makes it a target for `@label`. Definitions and results are filled boxes, an example is an outlined box, and a remark is an aside with a rule down its side. |
| `proof`, `solution` | A collapsible block with a rule down its side, closed unless `collapsed: false`. |
| `gallery(columns: n, ..items)` | Items laid out in `n` columns (two on narrow screens). Use it in place of `grid`, which Typst drops in HTML export. |
| `widget(name, ..props)[fallback]` | An interactive component from `src/lib/widgets`. Props must be named; the fallback body is optional. |

## Pipeline

1. `src/lib/server/typst/cli.ts` runs the `typst` CLI with HTML export and
   refuses any version other than the pinned one, because HTML export is
   experimental and its output changes between releases.
2. `src/lib/server/typst/notes.ts` lists the notes, compiles one to an HTML
   fragment, reads its metadata from the `<note-meta>` label, and rejects
   widgets that are not registered.
   It then passes the fragment through `refine/`, described under
   [Repairing the exported HTML](#repairing-the-exported-html).
3. `src/routes/[course]/[slug]` prerenders each note. The build fails on a
   Typst error, a broken reference, bad metadata or an unknown widget.
4. `src/lib/styles/notes.css` styles the compiled markup. Math is native
   MathML set in STIX Two Math, so pages need no math JavaScript.

`pnpm run dev` reloads the page when a `.typ` file changes.

## Repairing the exported HTML

Typst's HTML export is experimental, and browsers disagree about MathML.
`src/lib/server/typst/refine/` parses the compiled fragment with parse5 and
rewrites the parts that render badly. No rule changes what a note says: the
accent rules swap a combining mark for the spacing form of the same mark, and
the others keep every character. `refine.test.ts` pins each rule, and each was
checked in Chromium and Firefox.

| Rule | Why |
|---|---|
| A combining accent (`hat`, `tilde`, `dot`, ...) becomes the spacing form of the same mark. | Chromium gives a combining mark that stands alone in an `<mo>` a zero-width box and paints it beside its base, or not at all. |
| The combining arrow of `arrow(x)` becomes a real arrow, at a fixed small size over a single letter. | Same cause; the arrow was painted to the left of its letter, over the neighbouring text. |
| A prime moves from a superscript to beside its base. | The prime glyph is already raised. As a superscript it is shrunk and raised again into a speck. |
| A bracket with nothing tall beside it is marked `stretchy="false"`. | Chromium reserves room for a stretchy bracket to grow, which sets `f(x)` as `f ( x )`. Brackets around fractions, matrices, roots and sums with limits still grow; brackets around superscripts keep their plain size, as in LaTeX without `\left`. |
| An inline formula longer than 24 characters is cut into several formulas with a `<wbr>` between them: after each relation or comma of its outermost level, or after its binary operators when it has none. Inline math does not wrap anywhere else. | Chromium never breaks a line inside a formula and Firefox breaks anywhere. A long formula overflowed a phone screen in one and split between a function and its argument in the other. A long formula whose operators all sit inside brackets is not cut and can still overflow. |
| A formula and the text that touches it (a comma, a bracket, `-th`), and the end-of-proof square with the word before it, are wrapped in `span.nobreak`. | A line could otherwise start with the comma or the square. |
| Each display equation is wrapped in `div.equation`. | Firefox does not scroll a `<math>` element, so a wide equation made the whole page scroll sideways. The wrapper scrolls instead, and a shadow marks the edge that hides more. On a phone it reaches into the gutter, so an equation a few pixels too wide is shown whole. |

`notes.css` also restores the table cell padding that the Tailwind reset
removes.

The same pass gives every second- and third-level heading an id made from its
text, unique on the page, and returns the headings. A note with at least two
of them lists them under "On this page": below the title on a narrow window,
and pinned beside the text on a wide one. The section being read is marked.
The list shows a heading's plain text, so a formula in a section heading
appears there as its bare symbols.

## Courses and navigation

A course is a directory of notes. `src/lib/site/courses.ts` registers each
course with its outline, its category and the page that introduces it; the
home page and that page both read from the registry. A note page takes its
breadcrumb and its link back to the outline from the registry, and its
previous and next links from the other notes in the same directory, in the
order of their `order` metadata. Two notes of a course may not share an
`order`. A course that is not registered still gets its pages and its previous
and next links, with a breadcrumb that leads only to the home page.

`courses.test.ts` checks that the notes linked from each outline are exactly
the notes of the course, in reading order, so the outline's numbering and the
previous and next links cannot drift apart.

`src/lib/site/title.ts` builds every document title as page, then course, then
site name. `src/routes/+error.svelte` is the page for an address that does not
exist.

## Printing

`src/lib/styles/print.css` drops the site header, footer and navigation, and
keeps cards, figures and equations from splitting across pages.
`src/lib/notes/print.ts` opens every collapsed proof and switches to the light
theme before the page prints, and undoes both afterwards, so a printout has
the proofs on white paper. A widget hides its own controls in print.

## Editor preview

`.vscode/settings.json` points tinymist at `notes/` as the Typst root and
passes `--input preview=true`. Tinymist's preview panel renders pages, where
HTML elements are dropped, so with that input `notes/lib/notes.typ` draws
cards, proofs and widgets as framed blocks instead. The site build never sets
the input and its output is unaffected. The preview shows the content and
structure, not the site's styling, and a widget appears as a named placeholder.

Leave `tinymist.exportTarget` at its default: set to `html`, the panel is blank.

## Widgets

A widget is a Svelte component registered by name in
`src/lib/widgets/registry.ts`. The compiled note carries a
`<notes-widget name props>` placeholder with fallback content;
`src/lib/widgets/mount.ts` replaces it in the browser and loads the component
only on pages that use it. Props are the named arguments of `#widget`, passed
as JSON.

A widget's registry entry may state the height it takes once mounted. The
compile step records that height on the placeholder, and while the widget is
loading the placeholder already takes it, so the text below does not jump.
Without JavaScript, or if the widget fails to load, the fallback content stays
at its own height.

### hadamard-tiling

`#widget("hadamard-tiling", start: 1, max: 6)` shows the Walsh-Hadamard matrix
of order 2^n as a tiling (+1 white, -1 black) and animates the recursive
construction between consecutive n.

It draws four canvases, each holding the matrix of order 2^level, one pixel per
entry. A stage says how far those copies are along the construction: stacked at
full size, shrunk into the top-left quarter, spread into the four quarters, and
finally with the bottom-right copy inverted. The last stage of one level is the
same picture as the first stage of the next, so each press first regroups to
whichever of the two it needs and then plays three stages. A press during an
animation jumps to its end and starts the move just asked for, so the controls
never lock. Regrouping repaints
and repositions the canvases with transitions switched off, inside the click,
so the swap is never visible. `max` is capped at 6 so every entry covers a
whole number of pixels on the 320px board.

## Not built yet

- Course index pages generated from the notes.
- Hover previews for references, and references between notes.
- Code block colours that follow the theme: Typst emits fixed light-theme
  colours.
- Diagrams and images.
