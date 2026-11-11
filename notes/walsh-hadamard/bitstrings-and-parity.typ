#import "/lib/notes.typ": *
#show: note.with(
  title: "Bitstrings and parity functions",
  summary: "Bitstrings, XOR, and the simple functions everything else is built from.",
  order: 1,
)

The Walsh-Hadamard transform works on functions whose inputs are strings of
bits. Before we can define it, we need three things: the strings themselves, a
way to add them, and a family of very simple functions called parity functions.
Nothing here needs more than arithmetic with $0$ and $1$.

= Bitstrings

#definition(title: "Bitstring")[
  A _bitstring_ of length $n$ is a sequence $x = x_1 x_2 dots.c x_n$ in which
  every $x_i$ is $0$ or $1$. The set of all bitstrings of length $n$ is written
  ${0, 1}^n$.
] <def-bitstring>

Each of the $n$ positions can be filled in two ways, so there are $2^n$
bitstrings of length $n$. For $n = 2$ they are $00$, $01$, $10$ and $11$.

= Adding bitstrings with XOR

For single bits, _XOR_ (exclusive or), written $xor$, is addition where we
only keep whether the result is even or odd:

$ 0 xor 0 = 0, quad 0 xor 1 = 1, quad 1 xor 0 = 1, quad 1 xor 1 = 0. $

In other words, $a xor b$ is $1$ exactly when $a$ and $b$ differ. The only
surprise compared with ordinary addition is $1 xor 1 = 0$.

#definition(title: "XOR of bitstrings")[
  For $x, y in {0, 1}^n$, the bitstring $x xor y$ is formed by XORing the two
  strings one position at a time: its $i$-th bit is $x_i xor y_i$.
] <def-xor>

#example(title: "XOR by hand")[
  To compute $1011 xor 0110$, compare the strings position by position and
  write $1$ wherever they differ: the answer is $1101$.
]

XOR behaves like addition in the ways we will rely on:

- The order does not matter: $x xor y = y xor x$.
- Grouping does not matter: $(x xor y) xor z = x xor (y xor z)$.
- The all-zero string changes nothing: $x xor 00 dots.c 0 = x$.
- Every string undoes itself: $x xor x = 00 dots.c 0$.

The last property is the unusual one. It means that adding and subtracting are
the same operation, so we never need a minus sign.

= The dot product

#definition(title: "Dot product")[
  For $a, x in {0, 1}^n$, the _dot product_ is the single bit
  $ a dot x = a_1 x_1 xor a_2 x_2 xor dots.c xor a_n x_n. $
] <def-dot>

The product $a_i x_i$ is $x_i$ when $a_i = 1$ and $0$ when $a_i = 0$. So it
helps to read $a$ as a _mask_ that selects some positions of $x$. Then $a dot x$
answers one question: among the selected positions, is the number of $1$s odd?

#example(title: "Dot product by hand")[
  Let $a = 1010$ and $x = 1110$. The mask $a$ selects positions $1$ and $3$,
  where $x$ has the bits $1$ and $1$. That is two $1$s, an even number, so
  $a dot x = 0$.
]

= Parity functions

#definition(title: "Parity function")[
  Fix a mask $a in {0, 1}^n$. The _parity function_ for $a$ takes a bitstring
  $x$ and returns the bit $a dot x$.
] <def-parity>

There is one parity function for each mask, so there are $2^n$ of them. The
mask $00 dots.c 0$ selects nothing and gives the function that is always $0$.
The mask $11 dots.c 1$ selects everything and tells us whether $x$ has an odd
number of $1$s.

Try it: click the bits to change the mask $a$ and the input $x$.

#widget("parity-explorer", size: 4)[
  The interactive parity explorer needs JavaScript.
]

Parity functions get along with XOR. This one fact is the reason they are the
right building blocks for everything that follows.

#proposition(title: "Parity functions are linear")[
  For every mask $a$ and all bitstrings $x$ and $y$,
  $ a dot (x xor y) = (a dot x) xor (a dot y). $
] <prop-linear>

#proof[
  Look at one position $i$. If $a_i = 0$, both sides contribute $0$. If
  $a_i = 1$, the left side contributes $x_i xor y_i$ and the right side
  contributes $x_i$ and $y_i$ separately, which XOR to the same thing. Since
  order and grouping do not matter for XOR, combining all positions gives the
  same bit on both sides.
]

= The $plus.minus 1$ convention

It is often more convenient to record a bit as a sign: write $+1$ for the bit
$0$ and $-1$ for the bit $1$. A bit $b$ becomes $(-1)^b$.

#definition(title: "Parity function, sign form")[
  For a mask $a in {0, 1}^n$, define
  $ chi_a (x) = (-1)^(a dot x). $
  So $chi_a (x) = +1$ when $a dot x = 0$, and $chi_a (x) = -1$ when
  $a dot x = 1$.
] <def-chi>

Why bother? Because signs turn XOR into ordinary multiplication:
$(+1)(+1) = +1$, $(+1)(-1) = -1$ and $(-1)(-1) = +1$ match the XOR table
exactly. In sign form, @prop-linear becomes

$ chi_a (x xor y) = chi_a (x) chi_a (y). $

#example(title: "All parity functions for two bits")[
  Each row is a mask $a$, each column is an input $x$, and each entry is
  $chi_a (x)$.

  #table(
    columns: 5,
    [], [$x = 00$], [$x = 01$], [$x = 10$], [$x = 11$],
    [$a = 00$], [$+1$], [$+1$], [$+1$], [$+1$],
    [$a = 01$], [$+1$], [$-1$], [$+1$], [$-1$],
    [$a = 10$], [$+1$], [$+1$], [$-1$], [$-1$],
    [$a = 11$], [$+1$], [$-1$], [$-1$], [$+1$],
  )

  Keep this table in mind. On the next page it reappears as a Hadamard matrix.
]

= Check your understanding

+ Compute $0111 xor 1101$.
+ Compute $a dot x$ and $chi_a (x)$ for $a = 0110$ and $x = 1011$.
+ Using the table above, multiply the rows for $a = 01$ and $a = 10$ entry by
  entry. Which row do you get?

#solution[
  + The strings differ in positions $1$ and $3$, so the answer is $1010$.
  + The mask selects positions $2$ and $3$, where $x$ has the bits $0$ and $1$.
    That is one $1$, an odd number, so $a dot x = 1$ and $chi_a (x) = -1$.
  + The products are $+1, -1, -1, +1$, which is the row for $a = 11$. This is
    no accident: $01 xor 10 = 11$, and in general
    $chi_a (x) chi_b (x) = chi_(a xor b) (x)$.
]

#remark(title: "Where this is going")[
  Bitstrings with XOR form what is called a vector space over the two-element
  field $FF_2$, and parity functions are its linear functions. We will not need
  that language yet, but it is why the words "linear" and "dot product" appear.
]
