#import "/lib/notes.typ": *
#show: note.with(
  title: "The Walsh-Hadamard transform",
  summary: "The Walsh-Hadamard Matrices, its relationships with the Fourier coefficients, and an algorithm to compute it efficiently.",
  order: 2,
)

To compute Fourier coefficients efficiently, we can discuss a specific family of matrices that are closely related to boolean functions.

= Hadamard Matrix

#definition(title: "Hamadard Matrix")[
  A _Hadamard matrix_ is a square matrix with entries in ${-1, +1}$ whose rows are mutually orthogonal.
] <def-hadamard-matrix>

This definition seems a bit difficult to work with, so let us prove an alternative criterion for Hadamard matrices.

#proposition(title: "Criterion for Hadamard Matrices")[
  Let $H$ be an $N times N$ matrix with entries in ${-1, +1}$. Then, $H$ is a Hadamard matrix if and only if $H H^"T" = N I_N$.
] <hadamard-criterion>

#proof[
  Let $H$ be an $N times N$ Hadamard matrix. Then,
  $
    H H^"T" [i,j] = H[i]^"T" dot H[j]^"T".
  $
  We know that for all $i != j$, the $i$-th and $j$-th rows of $H$ are orthogonal. Therefore, the dot product is zero whenever $i != j$, and since for any entry $x$ in $H$, we have $x in {-1,+1}$, so $x^2 = 1$, which yields  $ H[i]^"T" dot H[i]^"T" = N dot 1 = N. $

  Therefore,
  $ H H^"T" [i,j] = cases(N "if" i = j, 0 "otherwise"), $ so $H H^"T" = N I_N$.

  Conversely, if $H H^"T" = N I_N$, then for any $i != j$, we have
  $ H[i]^"T" dot H[j]^"T" = H H^T [i, j] = N I_N [i, j] = 0, $ so the rows of $H$ are mutually orthogonal, and hence $H$ is a Hadamard matrix. $square$
]

= The Walsh-Hadamard Matrices

#definition(title: "The Walsh-Hadamard Matrices")[
  The _Walsh-Hadamard matrices_ $(H_(2^n))_(n in NN^+)$ are a sequence of matrices defined recursively, with $H_1 = [1]$ and $ H_(2^(n+1)) = mat(delim: "[", H_(2^n), H_(2^n); H_(2^n), -H_(2^n)) $ for all integers $n >= 1$.
]

#let hadamard(n) = {
  let rows = ((255,),)
  for _ in range(n) {
    let flipped = rows.map(row => row.map(v => 255 - v))
    rows = rows.map(row => row + row) + rows.zip(flipped).map(((row, neg)) => row + neg)
  }
  rows
}

#let tiling(n) = {
  let size = calc.pow(2, n)
  figure(
    box(stroke: 0.5pt, image(
      bytes(hadamard(n).flatten()),
      format: (encoding: "luma8", width: size, height: size),
      scaling: "pixelated",
      width: 100%,
    )),
    caption: [$n = #n$],
    numbering: none,
  )
}

#gallery(columns: 4, ..range(0, 8).map(tiling))

Here is a small interactive widget that shows the construction of the matrix, where a white cell indicates a $1$ and a black cell indicates a $-1$.

#widget("hadamard-tiling", start: 1, max: 6)[
  The interactive tiling needs JavaScript.
]

Interestingly, families of Hadamard matrices were actually first constructed by James Joseph Sylvester in 1867 under the name of anallagmatic pavements, 26 years before Hadamard (1893) considered them.

The rows of the Walsh-Hadamard matrices, when viewed as boolean functions, are often used by electrical engineers to find transpositions of wires that minimized crosstalk, and Walsh introduced the idea formally into mathematics in 1923.

Despite being called the Walsh-Hadamard matrices, it is not entirely obvious that they are even Hadamard matrices. We can show that this is indeed true.

#proposition(title: "The Walsh-Hadamard Matrices are Hadamard matrices")[
  For all $n >= 1$, $H_(2^n)$ is a Hamadard matrix.
]

Intuitively, this is true by induction: for two different rows $r_1$ and $r_2$, the first half of $r_1$ and $r_2$ are orthogonal inductively, and the second half of $r_1$ and $r_2$ are also orthogonal inductively, since every row is just two copies of a row in the previous matrix in the sequence, potentially multiplied by $-1$. We can prove this more rigorously.

#proof[
  By the criterion from earlier, it suffices to show that $H_(2^n) = 2^n I_n$ for all $n >= 1$.

  We proceed by induction on $n$. Note that $H_(2^n)$ is symmetric for all $n$.

  For the base case, $H_1 = [1] = I_1$ has $H_1 = 1 dot I_1$.

  For the inductive case, let $n >= 1$. By blocking and symmetry, we have
  $
    H_(2^(n+1)) H_(2^(n+1))^"T" &= mat(delim: "[", H_(2^n) H_(2^n) + H_(2^n) H_(2^n), H_(2^n) H_(2^n) - H_(2^n) H_(2^n); H_(2^n) H_(2^n) - H_(2^n) H_(2^n), H_(2^n) H_(2^n) + H_(2^n) H_(2^n))\
    &= 2 dot mat(delim: "[", H_(2^n) H_(2^n)^"T", 0; 0, H_(2^n) H_(2^n)^"T")\
    &= 2 dot mat(delim: "[", 2^n I_(2^n), 0; 0, 2^n I_(2^n))\
    &= 2^(n+1) I_(2^(n+1)).
  $

  Therefore, $H_(2^n) = 2^n I_n$ for all $n >= 1$, which means they are all Hadamard matrices. $square$
]

Let us analyze the entries of the Walsh-Hadamard matrices. Before doing so, we notice that the indices are very large, from $1$ to $2^n$.

Furthermore, when analyzing row $i$ of $H_(2^n)$, we would like to case on whether $i$ is in the first or second half of the indices, because the definition of the row differs in the recursive definition based on which half $i$ is in. Casing on whether $i < 2^(n-1)$ and constructing the sub-index $i' = i mod 2^(n-1)$ seems quite annoying and unintuitive.

But not all hope are lost, and a natural but interesting idea surfaces. First, we will use $0$-based indexing, so the indices for the rows and columns of $H_(2^n)$ are from $0$ to $2^n - 1$. For an index $i in [0, 2^n - 1]$, let us write $i$ as a sequence of bits: $i = (i_0, i_1, ..., i_(n-1))$, where $i_0$ is the least significant bit and $i_(n-1)$ is the most significant bit.

With this notation, given an index $i = (i_0, i_1, ..., i_(n-1)),$ to get the index $i'$ for the submatrix from the previous iteration of the recursive definition, we can simply drop the most significant bit and write $ i' = (i_0, i_1, ..., i_(n-2)). $

Furthermore, this notation allows us to view indices are vectors in $FF_2^n$ as well, which seem to match closely with the topic of Boolean functions.

With this idea, let us prove a crucial property about the entries of the Walsh-Hadamard matrices.

#proposition(title: "Entries of the Walsh-Hadamard Matrices")[
  Let $n$ be a positive integer and $gamma, x in {0, 1, ..., 2^n-1}$ be zero-based indices. Then, the $(gamma, x)$-th entry of the Walsh-Hadamard matrix $H_(2^n)$ is given by
  $
    H_(2^n)[gamma, x] = (-1)^(gamma xor x),
  $

  where $xor$ denotes the bitwise XOR operation.

  Note that $gamma xor x$ can also be viewed as the value of $gamma dot x$, the dot product of $gamma$ and $x$ when viewed as vectors in $FF_2^n$.
]

#proof[
  We proceed by induction on $n$.

  For the base case, the only entry is $H_1[0, 0] = 1 = (-1)^(0 xor 0)$.

  For the inductive case, let $n >= 1$.
]

#remark[
  Much of the material from this chapter are taken from
  #link("https://mathworld.wolfram.com/HadamardMatrix.html").
]

