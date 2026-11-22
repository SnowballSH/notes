// The PDF edition of a note: pages for printing, with every proof shown and no widgets.

#let accents = (
  definition: rgb("#2f6fb5"),
  theorem: rgb("#6b4fb0"),
  proposition: rgb("#6b4fb0"),
  lemma: rgb("#6b4fb0"),
  example: rgb("#2c8a6a"),
  exercise: rgb("#b0721e"),
  remark: rgb("#6c7480"),
)

#let muted = rgb("#5b6470")
#let rule = rgb("#c9ced6")
#let link-colour = rgb("#1f5fa8")

// What the site knows about a note and the typesetter does not, passed in by the build.
#let site = sys.inputs.at("site", default: none)
#let edition = (
  course: sys.inputs.at("course", default: none),
  number: sys.inputs.at("number", default: none),
  url: if site != none { site + sys.inputs.at("path", default: "") },
  references: json(bytes(sys.inputs.at("references", default: "{}"))),
)

// A link written for the site, such as "/course/note#section", leads to the site from a page.
#let absolute(destination) = if site != none and type(destination) == str and destination.starts-with("/") {
  site + destination
} else {
  destination
}

#let card(kind, heading, body) = {
  let accent = accents.at(kind)
  block(
    width: 100%,
    fill: accent.lighten(93%),
    stroke: (left: 2pt + accent),
    radius: (right: 3pt),
    inset: (x: 10pt, y: 8pt),
    above: 1.2em,
    below: 1.2em,
    // A card is a figure, and a figure's block is kept on one page unless told otherwise.
    breakable: true,
    align(start, block(sticky: true, text(fill: accent.darken(25%), heading)) + body),
  )
}

#let aside(heading, body) = block(
  width: 100%,
  stroke: (left: 1pt + rule),
  inset: (left: 10pt, y: 2pt),
  above: 1em,
  below: 1.2em,
  align(start, emph(heading) + [.] + h(0.4em) + body),
)

#let widget-note = block(
  width: 100%,
  above: 1em,
  below: 1.2em,
  text(fill: muted, size: 0.9em, style: "italic", {
    [This part is interactive in the online edition]
    if edition.url != none [: #link(edition.url)]
    [.]
  }),
)

#let reference(note, target, words) = {
  let found = edition.references.at(note + "#" + target, default: none)
  if found == none { return if words != none { words } else { emph[#note, #target] } }
  link(found.href, if words != none { words } else { found.name })
}

#let running-title(title) = {
  let parts = (edition.course, if edition.number != none { edition.number + " " + title } else { title })
  parts.filter(part => part != none).join([ #sym.dot.c ])
}

#let title-block(title) = block(below: 1.6em, {
  if edition.course != none {
    text(fill: muted, size: 0.95em, edition.course)
    linebreak()
  }
  text(size: 1.9em, weight: "bold", {
    if edition.number != none { text(fill: muted, edition.number + h(0.5em)) }
    title
  })
  v(0.3em)
  line(length: 100%, stroke: 0.6pt + rule)
})

#let pages(title, body) = {
  set document(title: title)
  set page(
    paper: "a4",
    margin: (x: 2.5cm, top: 2.6cm, bottom: 2.6cm),
    header: context if counter(page).get().first() > 1 {
      text(fill: muted, size: 0.85em, running-title(title))
    },
    footer: context text(fill: muted, size: 0.85em, grid(
      columns: (1fr, auto),
      column-gutter: 1em,
      if edition.url != none { link(edition.url, edition.url.replace(regex("^https?://"), "")) },
      counter(page).display(),
    )),
  )
  set text(font: "Libertinus Serif", size: 10.5pt, lang: "en")
  set par(justify: true)
  show heading: set block(above: 1.6em, below: 0.8em)
  show heading.where(level: 1): set text(size: 1.25em)
  show link: set text(fill: link-colour)
  show link: it => if absolute(it.dest) == it.dest { it } else { link(absolute(it.dest), it.body) }
  // Typst already sets raw text at 0.8em, so this brings it to the height of the words around it.
  show raw: set text(font: "DejaVu Sans Mono", size: 1.05em)
  show raw.where(block: true): block.with(
    width: 100%,
    fill: luma(246),
    radius: 3pt,
    inset: 8pt,
  )
  show figure.caption: set text(fill: muted, size: 0.9em)
  show quote.where(block: true): it => block(
    width: 100%,
    stroke: (left: 1pt + rule),
    inset: (left: 10pt, y: 2pt),
    it.body + if it.attribution != none { align(end, [#sym.dash.em #it.attribution]) },
  )
  set table(stroke: 0.5pt + rule, inset: 6pt)
  title-block(title)
  body
}
