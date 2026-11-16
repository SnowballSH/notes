# Writing notes

How to add and edit notes. [`notes-system.md`](notes-system.md) explains how
the site turns them into pages, and [`widgets.md`](widgets.md) how to write an
interactive widget.

## See what you write

```bash
pnpm run dev
```

Open the address it prints. A note at `notes/<course>/<slug>.typ` is served at
`/<course>/<slug>`, and the page reloads when you save, add or remove a file under `notes/`.

- A Typst error is shown on the page in place of the note, with the file and
  line.
- A notice above the note lists anything Typst left out of the page, such as
  an element that HTML export does not support yet.
- `/guide/elements` shows every element a note can use, as it renders on the
  site. Its source, `notes/guide/elements.typ`, is the example to copy from.

In VS Code, the tinymist preview panel also works on a note. It shows the
content and structure, not the site's styling.

## Add a note to a course

1. Create the file:

   ```bash
   pnpm run new:note <course> <slug> The title of the note
   ```

   It writes `notes/<course>/<slug>.typ` as a draft and prints the next
   steps. Names are lowercase words joined by hyphens. The course must be
   registered or already have a directory; `--new-course` starts an
   unregistered one. The header it writes:

   ```typst
   #import "/lib/notes.typ": *
   #show: note.with(
     title: "The title of the note",
     summary: "One sentence that says what this note covers, for search engines.",
     draft: true,
   )
   ```

2. Give the note its place: in `src/lib/outlines/<course>.ts`, add
   `note: "<slug>"` to the section it covers. The outline is the only place
   that orders a course. It decides the note's number (the second section of
   the first part is 1.2), its link on the outline and home pages, and its
   previous and next links. Give the note and its section the same title:
   the page shows the note's, and the links to it show the section's.
3. Write the note's `summary`, then remove `draft: true` from the header to
   publish.

`pnpm run test` and the build fail, saying which line to add or remove in
which file, when a published note is in no section of the outline, when a
section names a note that does not exist, when two sections name the same
note, when a note and its section have different titles, or when a published
note still has the summary it was created with.

## Keep a note unpublished

Add `draft: true` to the header. A draft is served by `pnpm run dev`, marked
as a draft, and left out of the published site. A section of the outline may
already name it: while developing, the section links to the note with a
"Draft" badge, and the published site shows the section as planned. Remove the
line to publish.

## Write the content

`/guide/elements` is the reference. In short:

| To get | Write |
|---|---|
| A section, a subsection | `= Title`, `== Title` |
| A defined term | `_term_` |
| Inline and display math | `$x^2$`, and `$ x^2 $` with spaces inside the dollars |
| A numbered card | `#definition(title: "Name")[...]`, and likewise `theorem`, `proposition`, `lemma`, `example`, `remark` |
| A collapsed proof | `#proof[... $square$]`, or `#solution[...]` |
| A reference to a card | Put `<thm-name>` after the card, then write `@thm-name` |
| A reference to a card in another note | `#noteref("<slug>", <thm-name>)` writes "Theorem 2" and links to it; `#noteref("<slug>", <thm-name>)[other words]` keeps your words. Use `"<course>/<slug>"` for a note of another course. The build fails if the note or the label does not exist. |
| A link to another note | `#link("/<course>/<slug>")[the previous chapter]` |
| A figure | `#figure(image("picture.png", alt: "What it shows"), caption: [...])`, with the file beside the note |
| Figures side by side | `#gallery(columns: 3, figure(...), figure(...), figure(...))` |
| A table | `#table(columns: 3, table.header[A][B][C], [1], [2], [3])`, inside `#figure` for a caption |
| Code | A fenced block with a language, as in Markdown |
| A widget | `#widget("name", prop: 1)[Shown until the widget loads.]` |

Things to know:

- Section headings are plain text. The "On this page" list shows them, and a
  formula in a heading appears there as bare symbols.
- A display equation wider than the page scrolls sideways on its own. A long
  inline formula breaks after `=` and similar relations; keep very long
  formulas in display equations.
- A card's label is its address on the page, so each label is used once in a
  note, and is not the name a section or a numbered card would get on its own
  (`<parity>` under a section called "Parity", or `<theorem-2>`). The build
  says so if it is.
- Give a figure that carries information an `alt:`. Without one it takes its
  caption as its description, and with neither a screen reader skips it. PNG,
  JPEG and SVG files work. A small figure opens enlarged when clicked.
- `grid` is dropped by HTML export; use `gallery`. `overline`, `underline`
  inside math and `line` are dropped too, and the build tells you when an
  element was left out. Equation numbers are dropped without a warning: a
  reference says "Equation 1" but no equation shows a number, so do not number
  equations.

## Start a course

1. Describe the course in `src/lib/outlines/<course>.ts`: its title, a
   one-line description, its parts and their sections, and its sources. Copy
   `walsh-hadamard.ts`. A section without `note:` is shown as planned.
2. Register it in `src/lib/site/courses.ts` with its outline and a category
   from `src/lib/site/categories.ts`. The outline page is then served at
   `/<category>/<course>` and listed on the home page; there is no page to
   write.
3. Add notes as described above. The notes directory is `notes/<course>/`,
   with the same name as the outline file and the registered `slug`.

A new category is one more entry in `categories.ts`. Its `slug` is the first
part of the address of its outline pages, and may not be the name of a
directory under `notes/`.

A directory of notes that is not registered still gets its pages, without an
outline: its notes are published unless they are drafts, and their previous
and next links follow `order: <number>` in each header, which no two notes of
the directory may share.

## Before you publish

```bash
pnpm run check && pnpm run lint && pnpm run test && pnpm run build
```

The build fails, naming the file (and the line, for what Typst itself reports),
on a Typst error or warning, a
reference to a label that does not exist, a bad header, an outline that
disagrees with its notes, or a widget that is not registered.
