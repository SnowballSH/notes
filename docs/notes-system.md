# Notes system

A note is one Typst file, compiled to static HTML when the site builds. Notes
are files in git and render the same for every reader; anything interactive
runs in the browser as a widget. This is the prototype of that pipeline, with
`notes/walsh-hadamard/bitstrings-and-parity.typ` as its first page.

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
| `definition`, `theorem`, `proposition`, `lemma`, `example`, `remark` | A numbered card. `title:` is optional; `collapsed: true` or `false` makes it collapsible. A label makes it a target for `@label`. |
| `proof`, `solution` | A collapsible block, closed unless `collapsed: false`. |
| `gallery(columns: n, ..items)` | Items laid out in `n` columns (two on narrow screens). Use it in place of `grid`, which Typst drops in HTML export. |
| `widget(name, ..props)[fallback]` | An interactive component from `src/lib/widgets`. Props must be named; the fallback body is optional. |

## Pipeline

1. `src/lib/server/typst/cli.ts` runs the `typst` CLI with HTML export and
   refuses any version other than the pinned one, because HTML export is
   experimental and its output changes between releases.
2. `src/lib/server/typst/notes.ts` lists the notes, compiles one to an HTML
   fragment, reads its metadata from the `<note-meta>` label, and rejects
   widgets that are not registered.
3. `src/routes/[course]/[slug]` prerenders each note. The build fails on a
   Typst error, a broken reference, bad metadata or an unknown widget.
4. `src/lib/styles/notes.css` styles the compiled markup. Math is native
   MathML set in STIX Two Math, so pages need no math JavaScript.

`pnpm run dev` reloads the page when a `.typ` file changes.

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

### hadamard-tiling

`#widget("hadamard-tiling", start: 1, max: 6)` shows the Walsh-Hadamard matrix
of order 2^n as a tiling (+1 white, -1 black) and animates the recursive
construction between consecutive n.

It draws four canvases, each holding the matrix of order 2^level, one pixel per
entry. A stage says how far those copies are along the construction: stacked at
full size, shrunk into the top-left quarter, spread into the four quarters, and
finally with the bottom-right copy inverted. The last stage of one level is the
same picture as the first stage of the next, so each press first regroups to
whichever of the two it needs and then plays three stages. Regrouping repaints
and repositions the canvases with transitions switched off, inside the click,
so the swap is never visible. `max` is capped at 6 so every entry covers a
whole number of pixels on the 320px board.

## Not built yet

- Course index pages, a table of contents, and previous/next links.
- Hover previews for references, and references between notes.
- Code block colours that follow the theme: Typst emits fixed light-theme
  colours.
- Diagrams and images.
