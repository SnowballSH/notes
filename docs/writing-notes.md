# Writing notes

How to add and edit notes. [`notes-system.md`](notes-system.md) explains how
the site turns them into pages, and [`widgets.md`](widgets.md) how to write an
interactive widget.

## See what you write

```bash
pnpm run dev
```

Open the address it prints. A note at `notes/<course>/<slug>.typ` is served at
`/<course>/<slug>`, and the page reloads when you save a `.typ` file.

- A Typst error is shown on the page in place of the note, with the file and
  line.
- A notice above the note lists anything Typst left out of the page, such as
  an element that HTML export does not support yet.
- `/guide/elements` shows every element a note can use, as it renders on the
  site. Its source, `notes/guide/elements.typ`, is the example to copy from.

In VS Code, the tinymist preview panel also works on a note. It shows the
content and structure, not the site's styling.

## Add a note to a course

1. Create `notes/<course>/<slug>.typ`. Names are lowercase words joined by
   hyphens. Start it with:

   ```typst
   #import "/lib/notes.typ": *
   #show: note.with(
     title: "The title of the note",
     summary: "One sentence, shown to search engines.",
     order: 3,
   )
   ```

2. Give it an `order` that no other note of the course has. Previous and next
   links follow `order`.
3. Link it from the course outline: add `href: "/<course>/<slug>"` to its
   section in `src/lib/outlines/<course>.ts`. `pnpm run test` fails if the
   outline and the notes disagree about which notes exist or in what order.

## Keep a note unpublished

Add `draft: true` to the header. A draft is served by `pnpm run dev`, marked
as a draft, and left out of the published site, its previous and next links,
and the outline check. Remove the line to publish.

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
| A link to another note | `#link("/<course>/<slug>#thm-name")[Theorem 2 of the previous chapter]` |
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
- `grid` is dropped by HTML export; use `gallery`. `overline`, `underline`
  inside math, `line` and equation numbers are dropped too. The build tells
  you when an element was left out.

## Start a course

1. Create `notes/<course>/` with at least one note.
2. Describe the course in `src/lib/outlines/<course>.ts`: its title, a
   one-line description, its parts and their sections, and its sources. Copy
   `walsh-hadamard.ts`.
3. Register it in `src/lib/site/courses.ts` with its category and the address
   of its outline page.
4. Add the outline page at that address by copying
   `src/routes/special-topics/walsh-hadamard/+page.svelte` and changing the
   course it names.

## Before you publish

```bash
pnpm run check && pnpm run lint && pnpm run test && pnpm run build
```

The build fails, with the file and line, on a Typst error or warning, a
reference to a label that does not exist, a bad header, two notes with the
same `order`, or a widget that is not registered.
