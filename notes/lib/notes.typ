#let card-kinds = (
  definition: "Definition",
  theorem: "Theorem",
  proposition: "Proposition",
  lemma: "Lemma",
  example: "Example",
  remark: "Remark",
)

#let is-card(it) = type(it.kind) == str and it.kind in card-kinds

// An editor preview sets this input: it renders pages, where HTML elements are dropped.
#let preview = "preview" in sys.inputs

#let preview-frame(dashed: false, body) = block(
  width: 100%,
  inset: 10pt,
  radius: 4pt,
  stroke: (paint: luma(190), thickness: 0.6pt, dash: if dashed { "dashed" } else { "solid" }),
  align(start, body),
)

#let card-heading(kind, title) = {
  let label = context [#card-kinds.at(kind) #counter(figure.where(kind: kind)).display()]
  if preview { strong(label) } else { html.elem("strong", label) }
  if title != none [ (#title)]
}

#let collapsible(class, heading, collapsed, body) = {
  if preview { return preview-frame(heading + parbreak() + body) }
  let attrs = (class: class)
  if not collapsed { attrs.insert("open", "") }
  html.elem("details", attrs: attrs, html.elem("summary", heading) + body)
}

// A card is a figure so that it is numbered and can be referenced by label.
#let card(kind, title: none, collapsed: none, body) = figure(
  kind: kind,
  supplement: card-kinds.at(kind),
  numbering: "1",
  {
    let class = "card card-" + kind
    let heading = card-heading(kind, title)
    if collapsed == none and not preview {
      html.elem("section", attrs: (class: class), html.elem("header", heading) + body)
    } else {
      collapsible(class, heading, collapsed, body)
    }
  },
)

#let definition = card.with("definition")
#let theorem = card.with("theorem")
#let proposition = card.with("proposition")
#let lemma = card.with("lemma")
#let example = card.with("example")
#let remark = card.with("remark")

#let proof(collapsed: true, body) = collapsible("proof", strong[Proof], collapsed, body)
#let solution(collapsed: true, body) = collapsible("solution", strong[Solution], collapsed, body)

// Named arguments become the widget's props. The optional body shows until the widget loads.
#let widget(name, ..args) = {
  let bodies = args.pos()
  assert(
    bodies.len() <= 1 and bodies.all(body => type(body) == content),
    message: "widget props must be named, with at most one content body",
  )
  let fallback = bodies.at(0, default: none)
  if preview { return preview-frame(dashed: true, strong[Widget: #name] + parbreak() + fallback) }
  html.elem(
    "notes-widget",
    attrs: (name: name, props: json.encode(args.named(), pretty: false)),
    fallback,
  )
}

// Typst drops grids in HTML export, so the site lays the items out with CSS instead.
#let gallery(columns: 2, ..items) = if preview {
  grid(columns: columns, gutter: 12pt, ..items)
} else {
  html.elem("div", attrs: (class: "gallery", style: "--columns: " + str(columns)), items.pos().join())
}

#let note(title: none, summary: none, order: 0, body) = {
  [#metadata((title: title, summary: summary, order: order)) <note-meta>]
  set page(width: 16cm, height: auto, margin: 1.2cm) if preview
  show figure: it => if is-card(it) { it.body } else { it }
  body
}
