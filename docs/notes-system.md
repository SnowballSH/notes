# Notes system

A note is one Typst file, compiled to static HTML when the site builds. Notes
are files in git and render the same for every reader; anything interactive
runs in the browser as a widget.

## Writing a note

[`writing-notes.md`](writing-notes.md) is the guide for authors: how to add a
note, keep it a draft, and what each element looks like in source.
`notes/guide/elements.typ` is a draft note that shows every element, served at
`/guide/elements` while developing.

`notes/<course>/<slug>.typ` is served at `/<course>/<slug>`. Adding a file adds
the page. Names are lowercase words joined by hyphens. A note whose header says
`draft: true` is compiled and served only while developing.

`notes/lib/notes.typ` provides:

| Function | Renders as |
|---|---|
| `definition`, `theorem`, `proposition`, `lemma`, `example`, `exercise`, `remark` | A numbered card. `title:` is optional; `collapsed: true` or `false` makes it collapsible. A label makes it a target for `@label`. Definitions and results are filled boxes, an example or an exercise is an outlined box, and a remark is an aside with a rule down its side. |
| `proof`, `solution` | A collapsible block with a rule down its side, closed unless `collapsed: false`. |
| `gallery(columns: n, ..items)` | Items laid out in `n` columns (two on narrow screens). Use it in place of `grid`, which Typst drops in HTML export. |
| `noteref(note, <label>)[words]` | A link to a labelled card of another note, written as the card's name ("Theorem 2") unless words are given. `note` is a slug of the same course, or `course/slug`. The compile step resolves it against the other note and fails if the note or the label is missing, or if a published note points into a draft. |
| `widget(name, ..props)[fallback]` | An interactive component from `src/lib/widgets`. Props must be named; the fallback body is optional. See [`widgets.md`](widgets.md). |

`pnpm run new:note <course> <slug> <title...>` creates the file from a
template and prints what is left to do. The note always starts as a draft; in
a directory without an outline it also gets the next free `order`. The command
refuses to overwrite a note, and refuses a course that has neither an outline
nor a directory unless `--new-course` is given.

## Pipeline

1. `src/lib/server/typst/cli.ts` runs the `typst` CLI with HTML export and
   refuses any version other than the pinned one, because HTML export is
   experimental and its output changes between releases.
2. `src/lib/server/typst/notes.ts` lists the notes, compiles one to an HTML
   fragment, reads its metadata from the `<note-meta>` label, and rejects
   a widget that does not exist or is given props it does not take.
   It then passes the fragment through `refine/`, described under
   [Repairing the exported HTML](#repairing-the-exported-html).
3. `src/routes/[course]/[slug]` prerenders each note. The build fails on a
   Typst error, a broken reference, bad metadata, a misused widget, or a
   Typst warning, such as an element that HTML export leaves out. The message
   names the file and line.
4. `src/lib/styles/notes.css` styles the compiled markup. Math is native
   MathML set in STIX Two Math, so pages need no math JavaScript.

`pnpm run dev` reloads the page when a file under `notes/` is saved, added or
removed. While developing,
a Typst error is shown on the page in place of the note, and a Typst warning
is shown in a notice above it.

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
| A letter with a tail (gamma, chi, f, ...) that carries a subscript is wrapped in `<mpadded depth="0">`. | A subscript is placed below the lowest point of its base, so the tail pushed the subscript down and away from the letter. |
| A bracket with nothing tall beside it is marked `stretchy="false"`. | Chromium reserves room for a stretchy bracket to grow, which sets `f(x)` as `f ( x )`. Brackets around fractions, matrices, roots and sums with limits still grow; brackets around superscripts keep their plain size, as in LaTeX without `\left`. |
| An inline formula longer than 24 characters is cut into several formulas with a `<wbr>` between them: after each relation or comma of its outermost level, or after its binary operators when it has none. Inline math does not wrap anywhere else. | Chromium never breaks a line inside a formula and Firefox breaks anywhere. A long formula overflowed a phone screen in one and split between a function and its argument in the other. A long formula whose operators all sit inside brackets is not cut and can still overflow. |
| The colours of Typst's syntax theme on code become `token-*` classes. | Typst writes fixed colours meant for a white page; the stylesheet colours each kind of token for either theme. |
| An image without a description takes its figure's caption as its `alt`, or an empty one. | A screen reader otherwise reads out the address of the image, which for an embedded image is a long run of data. |
| A formula and the text that touches it (a comma, a bracket, `-th`), and the end-of-proof square with the word before it, are wrapped in `span.nobreak`. | A line could otherwise start with the comma or the square. |
| Each display equation is wrapped in `div.equation`. | Firefox does not scroll a `<math>` element, so a wide equation made the whole page scroll sideways. The wrapper scrolls instead, and a shadow marks the edge that hides more. On a phone it reaches into the gutter, so an equation a few pixels too wide is shown whole. |

`notes.css` also restores the table cell padding that the Tailwind reset
removes.

The same pass gives every second- and third-level heading an id made from its
text, unique on the page, and returns the headings. A note with at least two
of them lists them as "On this page": pinned beside the text on a wide window,
below the title on a medium one, and behind a "Contents" button in the corner
on a phone, where the list would fill the first screen. The button is there on
every window too narrow for the pinned list, so the sections and the top of
the page are one tap away. It steps aside while the reader scrolls down, so it
never covers the line being read, and returns on scrolling up or on keyboard
focus. The section being read is marked. The
list shows a heading's plain text, so a formula in a section heading appears
there as its bare symbols.

On a narrow screen `src/lib/notes/equations.ts` sets a display equation that
is up to about a fifth too wide smaller, so that it shows whole. Wider ones
scroll sideways. Whatever scrolls sideways on its own (such an equation, or a
code block or table too wide for the screen) is put in the tab order by
`src/lib/notes/scrolling.ts`, so the keyboard can reach and scroll it.

Every card also gets an id: its label if the author gave it one, otherwise its
kind and number, such as `theorem-3`. Each card heading and section heading
carries a small `#` link to itself, shown when the heading is pointed at (and
always on a touch screen), so a reader can share "Theorem 3".

## Courses and navigation

A course is a directory of notes, an outline in `src/lib/outlines/<course>.ts`
and an entry in `src/lib/site/courses.ts` that gives it a category from
`categories.ts`. Nothing else is written per course:

- `src/routes/[category=category]/[course]` serves the outline of every
  registered course at `/<category slug>/<course slug>`. Notes are served by
  `[course]/[slug]`, which has the same shape, so the `category` matcher in
  `src/params.ts` accepts only the slugs in `categories.ts`. A test keeps a
  category from taking the name of a notes directory.
- The home page lists every registered course with what is written.

The outline is the single source of a course's reading order. A section names
its note by slug (`note: "boolean-functions"`), and
`src/lib/outlines/contents.ts` derives the rest from the outline and the list
of notes on disk: each section's number (`<part>.<section>`), its link, and
its state.

| State | When | Shown as |
|---|---|---|
| written | The section names a published note. | A link. |
| draft | The section names a draft note, while developing. | A link with a "Draft" badge. |
| planned | The section names no note, or names a draft in the published site. | Muted text with a "Planned" badge, no link. |

A note page takes its number, its breadcrumb, its previous and next links and
its link back to the outline from the same data, so the outline page and the
note pages cannot drift apart. Previous and next skip planned sections.

`contents.ts` refuses an outline that disagrees with the notes: a published
note that no section names, a section naming a note that does not exist, a
note named twice, or a published note whose title differs from its section's.
Each message names the file and the line to add or remove.
The check runs wherever the outline is read, so it fails the build (on the
home page, the outline page and every note page of the course) and
`courses.test.ts` with the same message; while developing it is shown on the
page.

A directory of notes that is not registered still gets its pages, with a
breadcrumb that leads only to the home page. Its previous and next links
follow the `order` metadata of its notes, and two of them may not share an
`order`. In a registered course `order` is not read.

`src/lib/components/PageMeta.svelte` gives every page its title, description,
canonical address and the Open Graph tags a shared link is previewed from.
`sitemap.xml` is prerendered from the home page, the outlines and the published
notes, and `robots.txt` points to it. Drafts and the error page are marked
`noindex`.

`src/lib/site/title.ts` builds every document title as page, then course, then
site name. `src/routes/+error.svelte` is the page for an address that does not
exist.

## Search

`src/routes/search.json` is prerendered at build time from every published
note: one entry for the note, one for each section, and one for each numbered
card with its title ("Theorem 3: Plancherel and Parseval"). The Search button
in the header, `Ctrl+K`, `Cmd+K` or `/` opens a dialog that loads the index
once and lists the entries containing every word typed
(`src/lib/search/match.ts`). It finds where something is; the browser's own
find covers the text of the page being read.

A compiled note is kept in memory until one of its sources changes, so the
index and the pages do not compile a note twice. Its references to other notes
(`noteref`) are resolved after that, against the other notes as they are then.

## Reading conveniences

`src/lib/notes/progress.ts` remembers, on the reader's device, the note of each
course they opened last. The home page and the outline page then offer
"Continue with 1.2" in place of "Start reading". Nothing leaves the browser.

`src/lib/notes/figures.ts` lets a figure's image open enlarged in a dialog, by
click or with Enter, since a detailed figure in a gallery is too small to read.

## Collapsible blocks

`src/lib/notes/blocks.ts` keeps, for the browser session, which proofs and
other collapsible blocks the reader opened on each page, and reopens them when
the reader comes back or the page reloads; after a reload it also puts the
scroll position back, which the reopened proofs would otherwise shift. That
covers the reload `pnpm run dev` does on every save. An open block taller than
most of the window gets a button at its end to close it, and a button above
the note opens or closes them all.

## Reference previews

`src/lib/notes/references.ts` shows the block a reference points at (a card, a
figure or an equation) beside the reader's place, as a copy of the block. A
mouse shows it on hover and a keyboard on focus, and following the link still
jumps there. On a touch screen the first tap shows the preview, with a link to
go to the block.

## Printing

`src/lib/styles/print.css` drops the site header, footer and navigation, and
keeps cards, figures and equations from splitting across pages.
`src/lib/notes/print.ts` opens every collapsed proof and switches to the light
theme before the page prints, and undoes both afterwards, so a printout has
the proofs on white paper. A widget hides its own controls in print.

## PDF edition

Every published note also has a PDF, served at the note's address with `.pdf`
added (`/walsh-hadamard/qubits.pdf`) and offered by the "Download PDF" link
above the note. It is the same Typst source set on A4 pages, so nothing is
converted from the HTML:

- The build passes `--input print=true`, and `notes/lib/notes.typ` then hands
  each element to `notes/lib/print.typ` instead of writing HTML: a card is a
  lightly tinted block in the colour of its kind, a proof or solution is shown
  in full, and a widget becomes one line that points to the online edition.
- The site also passes what Typst cannot know (`printInputs` in
  `src/lib/server/typst/notes.ts`): the site's origin and the note's path,
  its course title and number, and where each `noteref` leads, taken from the
  compiled HTML of the note it points into. A link written for the site, such
  as `/walsh-hadamard/walsh-hadamard#implementation`, is given the origin, so
  every link in the PDF leads to the site.
- `compilePdf` in `src/lib/server/typst/cli.ts` runs Typst with
  `--ignore-system-fonts`. The pages use only the fonts that ship with Typst
  (Libertinus Serif, New Computer Modern Math, DejaVu Sans Mono), so a
  laptop, CI and the image build set identical pages.
- `src/routes/[course]/[slug].pdf/+server.ts` is prerendered like the note's
  page: one PDF per published note lands in `build/`, a draft has one only
  while developing, and a Typst warning fails the build.

To look at the pages while writing, open the PDF's address on the dev server,
or run Typst yourself:

```bash
typst compile --root notes --input print=true notes/<course>/<slug>.typ note.pdf
```

Without the site's inputs the title has no course or number, and a `noteref`
without words of its own shows the note and label it names.

## Editor preview

`.vscode/settings.json` points tinymist at `notes/` as the Typst root and
passes `--input preview=true`. Tinymist's preview panel renders pages, where
HTML elements are dropped, so with that input `notes/lib/notes.typ` draws
cards, proofs and widgets as framed blocks instead. The site build never sets
the input and its output is unaffected. The preview shows the content and
structure, not the site's styling, and a widget appears as a named placeholder.

Leave `tinymist.exportTarget` at its default: set to `html`, the panel is blank.

## Widgets

[`widgets.md`](widgets.md) is the guide to creating one. In brief:

- A widget is a directory `src/lib/widgets/<name>/` holding `definition.ts`
  (its props and, optionally, the height it takes once mounted) and its
  component, named in PascalCase. `registry.ts` finds both with
  `import.meta.glob`, so there is no list to edit. Definitions are imported
  eagerly: they are plain data that the note compiler and the tests read
  without rendering anything. Components are imported lazily, so a page loads
  only the code of the widgets it uses.
- `contract.ts` defines what a definition may declare. The component's props
  type is inferred from it.
- The compiled note carries a `<notes-widget name props>` placeholder with the
  fallback content; props are the named arguments of `#widget`, as JSON.
  `src/lib/server/typst/widgets.ts` checks every placeholder against its
  definition when the note is compiled.
- `mount.ts` replaces the placeholder in the browser, with the definition's
  defaults filled in for the props the note left out.
- `WidgetFrame.svelte` is the figure, caption and spacing that widgets share.
- `/dev/widgets` is a playground that exists only while developing.

The compile step records a widget's declared height on the placeholder, and
while the widget is loading the placeholder already takes it, so the text
below does not jump. Without JavaScript, or if the widget fails to load, the
fallback content stays at its own height.

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

The caption under the board names the matrix shown and, during an animation,
the step being played. The left and right arrow keys move like the buttons
while either button has focus. Each caption is short enough to stay on one
line at a window width of 320px, which the reserved height relies on.

### The quantum widgets

The widgets of the Walsh-Hadamard notes say little and draw instead: a
caption is at most one short line of numbers, and what a screen reader needs
in words sits in a visually hidden paragraph of the caption. Their arithmetic
is in `src/lib/quantum/`, away from the components: `state.ts` (a state as
its list of amplitudes, and the Hadamard gate on every qubit), `fourier.ts`
(the Walsh-Hadamard matrix times a vector, and Fourier coefficients),
`grover.ts` (the sign oracle, inversion about the mean, and the angle and
success probability of Grover's algorithm), `sampling.ts` (a measurement
outcome, drawn from a random source the caller passes, so the tests are
deterministic), `drawing.ts` (what a pointer position or a key makes of an
amplitude, and normalising a drawing), `format.ts` (an amplitude as `+1/√2`
rather than 0.71, and `formatSigned` for a number with a minus sign and no
plus) and `numbers.ts` (`clamp`). `bitstrings` in `state.ts` lists the labels
of the basis states.

`SignedBar.svelte` is the bar every bar chart of amplitudes draws: it rises
in the accent colour for a positive amplitude and hangs in the warm colour
for a negative one, and animates through zero when the sign flips. Its `tone`
is `"neutral"` or `"accent"` where the colour marks something other than the
sign. The bar has no place of its own: the component that uses it puts it in
a positioned box and sets its `inset`, with a rule on `:global(.bar)`.

`AmplitudeChart.svelte` is the picture they share. Each basis state is a
column: a `SignedBar` on an axis, the amplitude written under it with its
sign, and a cell that darkens with the probability, which is why two
amplitudes of opposite sign get the same cell; `showProbabilityCells={false}`
leaves the cells out. Given an `ondraw` handler the bars become sliders.
`highlighted` underlines the named columns and sets their labels in bold, and
`level` draws a dashed line at an amplitude with a label such as μ. Its
hidden descriptions use the frame's `.spoken` class, so it is only used
inside a `WidgetFrame`.

- `#widget("unflipping-coin")` takes one qubit and one classical coin through
  the same steps: "Apply H" also tosses the coin, and "Measure" also looks at
  it. The coin has only probabilities, so it has cells and no bars. After a
  gate applied to a superposition the two terms of each amplitude are written
  out under the two panels, the cancelling pair in bold. `experiment.ts` holds
  the steps.
- `#widget("hadamard-amplitudes", qubits: 2)` has a drawable state of one to
  three qubits beside the same state with a Hadamard gate on every qubit,
  which follows the drawing as it is made. "Apply H" makes the transformed
  state the drawing, so pressing it twice returns the original. Three qubits
  is the most whose eight bars and numbers fit a note 288px wide.
- `#widget("fourier-spectrum")` has the truth table of a function on three
  bits as eight tiles, the bars of its eight Fourier coefficients, and its
  polynomial.
- `#widget("fwht-butterfly")` is the butterfly diagram of the fast transform
  on eight values, one round of the loop at a time; focusing an entry shows
  the two entries it came from.
- `#widget("convolution-grid")` is the 4 by 4 grid of products f(x) g(y) for
  two-bit inputs, tinted by x xor y, with the four sums under it.
- `#widget("qubit-circle")` draws a qubit with real amplitudes on the unit
  circle, where the Hadamard gate is a reflection.
- `#widget("fourier-sampling", qubits: 2, preset: "and")` shows the state
  after each step of Fourier sampling for a truth table the reader sets, and
  measures the last one.
- `#widget("circuit", kind: "fourier-sampling")` draws the circuit of
  Fourier sampling or, with `kind: "grover"`, of Grover's algorithm.
- `#widget("grover-mean")` runs Grover's algorithm one query and one
  diffusion gate at a time on bars with their average drawn in.
- `#widget("diffusion-fourier")` shows a drawable state above its Fourier
  coefficients, and the diffusion gate acting on both.
- `#widget("grover-rotation")` shows the state of Grover's algorithm turning
  by the same angle each iteration.
- `#widget("grover-success")` plots the success probability of Grover's
  algorithm against the number of queries, with the classical bound.
- `#widget("roadmap")` draws the sections of the course as boxes with arrows
  from each section to those that need it. A box links to its note once
  `/search.json` lists that note, so drafts and planned sections stay plain.
  The dependencies are in `roadmap/dependencies.ts`, keyed by section number.

The last five have no published note yet: their browser tests skip until the
overview and the note on Grover's algorithm are published.

Drawing: press on a bar's plot and drag, up for positive and down for
negative; dragging sideways draws on the bars passed over. The plot has
`touch-action: none`, so a finger draws rather than scrolls. While the
pointer is down the bars are exactly as drawn; on release the state is
normalised, and a stroke that erased every amplitude is dropped. Only the
primary button draws, and a stroke also ends when the pointer comes back with
no button down or loses its capture.

A focused bar takes the arrow keys (0.1), Page Up and Page Down (0.5), Home
and End (-1 and +1), Space or Enter (flip the sign) and Delete, Backspace or 0
(zero). Keys edit the drawing as it was last set and the chart shows its
normalisation, so a step up and a step down return exactly to the start; the
drawing is replaced by the normalised state whenever a stroke ends, a preset
is chosen or the gate is applied. A key that would not change the state, such
as an arrow on the only bar, is left to the browser. After each of these
actions a visually hidden line in the caption states the nonzero amplitudes
before and after the gate.

Neither reserves a height, because their panels stack in a narrow window.

## Tests

`pnpm run test` runs the unit tests: each rule of the HTML repair pass, the
outline logic, search matching, the widget contract and the scaffolds, and
that every note compiles to HTML and to a PDF without a warning.

`pnpm run test:e2e` builds the site, serves it, and checks it in Chromium and
Firefox (`tests/e2e/`). The tests find the site's pages by following its links
and pick their subjects by structure (the first note with a proof, the first
reference to a card), so editing a note does not break them: every page loads
without errors, never scrolls
sideways and passes the axe accessibility checks in both themes; opened
proofs survive a reload; a reference previews its target; search reaches a
named theorem; one link downloads the note as a PDF; the tiling widget loads
without moving the page; the qubit widgets show the amplitudes the notes
derive; on a phone the note
starts on the first screen and every equation and code block fits or scrolls
on its own.
It needs the browsers once: `pnpm exec playwright install chromium firefox`.
CI runs it on every pull request, keeps the traces of a failed run, and does
not publish the image unless it passes.

## Not built yet

- Equation numbers: Typst's HTML export drops them, and the build cannot tell.
- Drawings that follow the theme: an image is embedded as it is.
