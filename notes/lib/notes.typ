#let card-kinds = (
  definition: "Definition",
  theorem: "Theorem",
  proposition: "Proposition",
  lemma: "Lemma",
  example: "Example",
  remark: "Remark",
)

#let is-card(it) = type(it.kind) == str and it.kind in card-kinds

#let card-heading(kind, title) = {
  html.elem("strong", context [#card-kinds.at(kind) #counter(figure.where(kind: kind)).display()])
  if title != none [ (#title)]
}

#let collapsible(class, heading, collapsed, body) = {
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
    if collapsed == none {
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
  html.elem(
    "notes-widget",
    attrs: (name: name, props: json.encode(args.named(), pretty: false)),
    bodies.at(0, default: none),
  )
}

#let note(title: none, summary: none, order: 0, body) = {
  [#metadata((title: title, summary: summary, order: order)) <note-meta>]
  show figure: it => if is-card(it) { it.body } else { it }
  body
}
