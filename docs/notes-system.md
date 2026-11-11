# Notes system

A note is one Typst file, compiled to static HTML when the site builds. Notes
are files in git and render the same for every reader; anything interactive
runs in the browser as a widget. This is the prototype of that pipeline, with
`notes/demo/monoids.typ` as its sample.

## Writing a note

`notes/<course>/<slug>.typ` is served at `/<course>/<slug>`. Adding a file adds
the page. Names are lowercase words joined by hyphens.

```typst
#import "/lib/notes.typ": *
#show: note.with(title: "Monoids", summary: "One line for search engines.", order: 1)

Plain text with $x + 0 = x$ inline and display math:
$ e * x = x * e = x $

#definition(title: "Monoid")[...] <def-monoid>
#proof[...]
#example(title: "Strings", collapsed: true)[...]
See @def-monoid.
#widget("cayley-table", size: 4)[Shown until the widget loads.]
```

`notes/lib/notes.typ` provides:

| Function | Renders as |
|---|---|
| `definition`, `theorem`, `proposition`, `lemma`, `example`, `remark` | A numbered card. `title:` is optional; `collapsed: true` or `false` makes it collapsible. A label makes it a target for `@label`. |
| `proof`, `solution` | A collapsible block, closed unless `collapsed: false`. |
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

## Widgets

A widget is a Svelte component registered by name in
`src/lib/widgets/registry.ts`. The compiled note carries a
`<notes-widget name props>` placeholder with fallback content;
`src/lib/widgets/mount.ts` replaces it in the browser and loads the component
only on pages that use it. Props are the named arguments of `#widget`, passed
as JSON.

## Not built yet

- Course index pages, a table of contents, and previous/next links.
- Hover previews for references, and references between notes.
- Code block colours that follow the theme: Typst emits fixed light-theme
  colours.
- Diagrams and images.
