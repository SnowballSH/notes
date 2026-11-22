#import "/lib/notes.typ": *
#show: note.with(
  title: "Boolean functions and Fourier expansions",
  summary: "Boolean functions as multilinear polynomials, parity functions, and the Fourier expansion.",
  order: 1,
)

Every Boolean function can be written as a polynomial, and the coefficients of that polynomial tell us a lot about the function. This chapter sets up that polynomial, the _Fourier expansion_, and the tools for working with its coefficients.

= Boolean Functions

#definition(title: "Boolean Function")[
  A _Boolean function_ is a function $f : {0, 1}^n -> {0, 1}$. We call $n$ the _arity_ of $f$.
] <def-boolean-function>

We will write the two bits in whichever way is most convenient:

- As elements of the field $FF_2$, so that the inputs form the vector space $FF_2^n$ and adding two inputs is taking their bitwise XOR.
- As the signs $1$ and $-1$, where the bit $b in FF_2$ becomes $(-1)^b$. So $0$ (false) becomes $1$, and $1$ (true) becomes $-1$.

The sign encoding turns addition in $FF_2$ into multiplication of real numbers, since $(-1)^(a + b) = (-1)^a (-1)^b$. This is what lets us write Boolean functions as polynomials. For that reason, we will mostly work with functions
$
  f : {-1, 1}^n -> {-1, 1},
$
and more generally with real-valued functions $f : {-1, 1}^n -> RR$.

#example(title: "AND of Two Bits")[
  In the sign encoding, the AND of two bits outputs $-1$ (true) if and only if both inputs are $-1$. We can check on all four inputs that
  $
    "AND"_2 (x_1, x_2) = 1/2 + 1/2 x_1 + 1/2 x_2 - 1/2 x_1 x_2.
  $
] <ex-and>

#example(title: "Majority of Three Bits")[
  The majority function outputs the sign that appears most often among its inputs. For three bits,
  $
    "Maj"_3 (x_1, x_2, x_3) = 1/2 x_1 + 1/2 x_2 + 1/2 x_3 - 1/2 x_1 x_2 x_3.
  $
]

Both polynomials are _multilinear_, which means no variable appears with a power larger than one. Note that this is no loss, because $x_i^2 = 1$ for $x_i in {-1, 1}$, so having higher powers doesn't really help.

= The Fourier Expansion

The monomials that appear in a multilinear polynomial are products of distinct variables, one for each subset of the variables.

#definition(title: "Parity Function")[
  For a subset $S subset.eq [n] = {1, 2, ..., n}$, the _parity function_ $chi_S : {-1, 1}^n -> {-1, 1}$ is
  $
    chi_S (x) = product_(i in S) x_i.
  $
  In particular, $chi_emptyset (x) = 1$.
] <def-parity>

The name of such functions comes from the other encoding. Let $x in FF_2^n$, and let $gamma in FF_2^n$ be the indicator vector of $S$, so that $gamma_i = 1$ if and only if $i in S$. Applying $chi_S$ to the signs $((-1)^(x_1), ..., (-1)^(x_n))$ gives
$
  product_(i in S) (-1)^(x_i) = (-1)^(sum_(i in S) x_i) = (-1)^(gamma dot x),
$
where $gamma dot x = sum_(i=1)^n gamma_i x_i$ is the dot product in $FF_2^n$. This means $chi_S$ computes the parity of the bits of $x$ selected by $S$. When the inputs are in $FF_2^n$, we index the parity functions by vectors and write
$
  chi_gamma (x) = (-1)^(gamma dot x).
$

There are $2^n$ parity functions, one for each subset of $[n]$. It makes sense, from our previous argument, that they are enough to build every function.

#theorem(title: "Fourier Expansion")[
  Every function $f : {-1, 1}^n -> RR$ can be written uniquely as a multilinear polynomial
  $
    f(x) = sum_(S subset.eq [n]) hat(f)(S) chi_S (x),
  $
  where each $hat(f)(S)$ is a real number. This is the _Fourier expansion_ of $f$, and $hat(f)(S)$ is the _Fourier coefficient_ of $f$ on $S$.
] <thm-fourier-expansion>

#proof[
  We first show that such a polynomial exists, by interpolation. For each point $alpha in {-1, 1}^n$, consider the polynomial
  $
    1_alpha (x) = product_(i=1)^n (1 + alpha_i x_i) / 2.
  $
  If $x = alpha$, every factor is $(1 + 1) / 2 = 1$, so $1_alpha (x) = 1$. If $x != alpha$, then $x_i != alpha_i$ for some $i$, and that factor is $(1 - 1) / 2 = 0$, so $1_alpha (x) = 0$. Therefore,
  $
    f(x) = sum_(alpha in {-1, 1}^n) f(alpha) 1_alpha (x) = 1/2^n sum_(alpha in {-1, 1}^n) f(alpha) product_(i=1)^n (1 + alpha_i x_i).
  $
  Expanding each product gives a sum of monomials $chi_S (x)$ with real coefficients, and collecting the terms for each $S$ gives the expansion.

  Uniqueness follows from @prop-coefficient-formula below, which computes each coefficient directly from $f$. $square$
]

#example(title: "Expanding AND by Interpolation")[
  The function $"AND"_2$ is $-1$ at the point $(-1, -1)$ and $1$ at the other three points. The four polynomials $1_alpha$ sum to $1$, so
  $
    "AND"_2 (x) & = 1 - 2 dot 1_((-1, -1)) (x) \
                & = 1 - 2 dot ((1 - x_1) (1 - x_2)) / 4 \
                & = 1/2 + 1/2 x_1 + 1/2 x_2 - 1/2 x_1 x_2,
  $
  which matches @ex-and. Writing $f = "AND"_2$, its Fourier coefficients are $hat(f)(emptyset) = hat(f)({1}) = hat(f)({2}) = 1/2$ and $hat(f)({1, 2}) = -1/2$.
]

= Orthonormality of the Parity Functions

The functions $f : {-1, 1}^n -> RR$ form a real vector space of dimension $2^n$, since a function is determined by its $2^n$ values. We can give this space an inner product.

#definition(title: "Inner Product")[
  For $f, g : {-1, 1}^n -> RR$, define
  $
    chevron.l f, g chevron.r = 1/2^n sum_(x in {-1, 1}^n) f(x) g(x) = EE_x [f(x) g(x)],
  $
  where the expectation is over a uniformly random $x in {-1, 1}^n$.
] <def-inner-product>

Under this inner product, the parity functions are as nice as a basis can be.

#lemma(title: "Products and Averages of Parity Functions")[
  Let $S, T subset.eq [n]$. Then:
  + $chi_S chi_T = chi_(S Delta T)$, where $S Delta T$ is the symmetric difference of $S$ and $T$.
  + $EE_x [chi_S (x)] = 1$ if $S = emptyset$, and $EE_x [chi_S (x)] = 0$ otherwise.
] <lem-parity-facts>

#proof[
  For the first claim, an index in $S inter T$ contributes $x_i^2 = 1$ to the product, so
  $
    chi_S (x) chi_T (x) = product_(i in S) x_i product_(i in T) x_i = product_(i in S Delta T) x_i = chi_(S Delta T) (x).
  $

  For the second claim, $chi_emptyset = 1$ has expected value $1$. If $S != emptyset$, the coordinates of a uniformly random $x$ are independent and each has expected value $0$, so
  $
    EE_x [chi_S (x)] = product_(i in S) EE_x [x_i] = 0. quad square
  $
]

#theorem(title: "The Parity Functions are Orthonormal")[
  For all $S, T subset.eq [n]$,
  $
    chevron.l chi_S, chi_T chevron.r = cases(1 & quad "if" S = T, 0 & quad "otherwise".)
  $
] <thm-orthonormal>

#proof[
  By @lem-parity-facts,
  $
    chevron.l chi_S, chi_T chevron.r = EE_x [chi_S (x) chi_T (x)] = EE_x [chi_(S Delta T) (x)],
  $
  which is $1$ if $S Delta T = emptyset$ and $0$ otherwise. $S Delta T = emptyset$ if and only if $S = T$. $square$
]

Orthonormality gives a direct formula for each Fourier coefficient.

#proposition(title: "Formula for the Fourier Coefficients")[
  Let $f : {-1, 1}^n -> RR$ and $S subset.eq [n]$. Then,
  $
    hat(f)(S) = chevron.l f, chi_S chevron.r = 1/2^n sum_(x in {-1, 1}^n) f(x) chi_S (x).
  $
] <prop-coefficient-formula>

#proof[
  Suppose $f = sum_(T subset.eq [n]) c_T chi_T$ for some real numbers $c_T$. By linearity of the inner product and @thm-orthonormal,
  $
    chevron.l f, chi_S chevron.r = sum_(T subset.eq [n]) c_T chevron.l chi_T, chi_S chevron.r = c_S.
  $
  This means that the coefficients of any such expression are determined by $f$, which proves both the formula and the uniqueness claimed in @thm-fourier-expansion. $square$
]

In the $FF_2^n$ notation, the same formula becomes
$
  hat(f)(gamma) = chevron.l f, chi_gamma chevron.r = 1/2^n sum_(x in FF_2^n) f(x) (-1)^(gamma dot x)
$
for $f : FF_2^n -> RR$ and $gamma in FF_2^n$.

The inner product of two functions can also be computed from their coefficients.

#theorem(title: "Plancherel and Parseval")[
  For all $f, g : {-1, 1}^n -> RR$,
  $
    chevron.l f, g chevron.r = sum_(S subset.eq [n]) hat(f)(S) hat(g)(S).
  $
  In particular, if $f : {-1, 1}^n -> {-1, 1}$, then
  $
    sum_(S subset.eq [n]) hat(f)(S)^2 = 1.
  $
] <thm-plancherel>

#proof[
  Expanding both functions and using @thm-orthonormal,
  $
    chevron.l f, g chevron.r
    & = sum_(S subset.eq [n]) sum_(T subset.eq [n]) hat(f)(S) hat(g)(T) chevron.l chi_S, chi_T chevron.r \
    & = sum_(S subset.eq [n]) hat(f)(S) hat(g)(S).
  $
  For the second claim, take $g = f$. Since $f$ only takes the values $1$ and $-1$, we have $chevron.l f, f chevron.r = EE_x [f(x)^2] = 1$. $square$
]

= Conclusion

In this chapter, we wrote Boolean functions as functions on ${-1, 1}^n$ and showed that each one is a unique linear combination of the $2^n$ parity functions. The parity functions are orthonormal, so the coefficient on $chi_S$ is the inner product $chevron.l f, chi_S chevron.r$, an average over all $2^n$ inputs.

#remark[
  The material from this chapter follows Sections 1.2 to 1.4 of O'Donnell's _Analysis of Boolean Functions_.
]

= Exercises

#exercise(title: "Parity of a Sum")[
  Let $gamma, x, y in FF_2^n$. Show that $chi_gamma (x xor y) = chi_gamma (x) chi_gamma (y)$.
] <exr-parity-of-a-sum>

#exercise(title: "The Empty Coefficient is the Average")[
  Let $f : {-1, 1}^n -> RR$. Show that $hat(f)(emptyset) = EE_x [f(x)]$.
] <exr-average>

#exercise(title: "Fourier Coefficients are Linear")[
  Let $f, g : {-1, 1}^n -> RR$ and $c in RR$. Show that $hat(f + g)(S) = hat(f)(S) + hat(g)(S)$ and $hat(c f)(S) = c hat(f)(S)$ for all $S subset.eq [n]$.
] <exr-linear>
