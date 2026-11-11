#import "/lib/notes.typ": *
#show: note.with(
  title: "Monoids",
  summary: "A sample note that exercises cards, collapsibles, references and a widget.",
  order: 1,
)

As you know, $0$ is more than just an idempotent: $0 + x = x + 0 = x$ for all
$x in ZZ$, so $0$ is an *identity element*. Idempotents are not always
identities. In the semigroup $x * y = x$, every element is an idempotent, but,
assuming $|S| >= 2$, no element is an identity. Having an identity is special,
which motivates another type of semigroup.

#definition(title: "Monoid")[
  A _monoid_ is a semigroup $chevron.l S; * chevron.r$ with an _identity_ element
  $e in S$, meaning
  $ e * x = x * e = x quad forall x in S. $
] <def-monoid>

#proposition(title: "Uniqueness of Identities")[
  The identity element in a monoid is unique.
] <prop-unique>

#proof[
  Suppose $e$ and $e'$ are both identities. Then $e = e * e' = e'$, where the
  first equality holds because $e'$ is an identity and the second because $e$
  is.
]

In light of @prop-unique, one often views a monoid as a structure
$chevron.l S; *; e chevron.r$ where the identity is given explicitly.

#example(title: "Natural Numbers", collapsed: true)[
  $chevron.l NN; +; 0 chevron.r$ and $chevron.l NN; dot; 1 chevron.r$ are both
  monoids.
]

#example(title: "Strings", collapsed: true)[
  Strings over an alphabet form a monoid under concatenation, with the empty
  string as the identity.
]

= A finite example

Addition modulo $n$ makes $ZZ_n = {0, 1, ..., n - 1}$ a monoid, as in
@def-monoid. Its identity is $0$: the row and column of $0$ in the table below
repeat the headers.

#widget("cayley-table", size: 4)[
  The interactive addition table for $ZZ_n$ needs JavaScript.
]

#remark(title: "Monoids vs. Semigroups")[
  How much do we lose by requiring an identity? Not much: any semigroup becomes
  a monoid once we add a new element $e$ and declare $e * x = x * e = x$.
]
