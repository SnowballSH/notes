#import "/lib/notes.typ": *
#show: note.with(
  title: "XOR convolution",
  summary: "Application of the fast Walsh-Hadamard transform: recovering the function from Fourier coefficients and efficiently computing the XOR convolution.",
  order: 3,
)

In this chapter, we will explore a practical application of the fast Walsh-Hadamard transform by discussing a fast algorithm for computing the XOR convolution of two Boolean functions.

= XOR Convolution

You might recall the word "convolution" from other subjects, such as calculus, where we defined
$
  (f * g)(t) = integral_(-oo)^oo f(tau) g(t - tau) dif tau,
$
or the discrete Fourier transform, where we defined
$
  (A * B)_k = sum_(i=0)^k a_i b_(k-i)
$
for polynomials $A(x) = sum_(i=0)^(n-1) a_i x^i$ and $B(x) = sum_(i=0)^(n-1) b_i x^i$. In all these cases, we are looking for the final "coefficient" or "value" at a certain position when two functions are "multiplied" together.

The same definition seems intuitive in the standard vector space of Boolean functions $FF_2^n -> RR$ on $chevron.l FF_2; xor, dot chevron.r$. In this world, we can also talk about which two scalars sum to a certain desired "index", and compute the final coefficient of the convolution at that index. This motivates the following definition.

#definition(title: "XOR Convolution")[
  Let $f : FF_2^n -> RR$ and $g : FF_2^n -> RR$ be Boolean functions. The _XOR convolution_ of $f$ and $g$ is the function $f * g : FF_2^n -> RR$ given by
  $
    (f * g)(z) := sum_(x xor y = z) f(x) g(y).
  $
] <def-xor-convolution>

In other words, $(f * g)(z)$ is the sum of all possible values of $f(x) g(y)$ such that $x xor y = z$.

A careful reader might observe that this form is not exactly the same as the examples enumerated above. In one of the above examples, we could have also defined $(A * B)_k = sum_(i + j = k) a_i b_j$, but always writing the convolution in this way seems a bit cumbersome to work with.

Interestingly, $xor$ is an involution (i.e. $x xor x = 0$) and commutative, so $x xor y = z <==> y = z xor x$. Therefore, we can rewrite the XOR convolution of @def-xor-convolution as follows.

#proposition(title: "Alternative Expression for the XOR Convolution")[
  $
    (f * g)(z) = sum_(x in FF_2^n) f(x) g(z xor x).
  $
] <prop-xor-convolution-alternative>

The problem is very simple: given functions $f$ and $g$, can we efficiently compute the function $f * g$ (i.e. $(f * g)(z)$ for every $z in FF_2^n$)?

There is an obvious "brute-force" $O(N^2) = O(2^(2n))$ algorithm for doing this, where $N = 2^n$. For each $z in FF_2^n$ and each $x in FF_2^n$, we can compute $f(x) g(z xor x)$ in constant time (we will assume the output values are small), so by @prop-xor-convolution-alternative the entire algorithm takes $O(2^n dot 2^n dot 1) = O(2^(2n)) = O(N^2)$ time. However, our previous discussions on the Walsh-Hadamard transform should convince you that a faster algorithm should exist. In this chapter, we will show that we can in fact reduce XOR convolution to a few calls to #noteref("walsh-hadamard", <thm-fwht>)[the fast Walsh-Hadamard transform], and hence compute $f * g$ in $O(N log N)$ time.

= Fourier Transforming the Convolution

Recall that the Walsh-Hadamard transform computes the Fourier coefficients of a Boolean function efficiently. To apply the Walsh-Hadamard transform to the XOR convolution problem, we should consider converting the problem to Fourier coefficient space.

Let's work backwards from what we want to compute. At the end of the algorithm, we need to output the function $f * g$. Ideally, at this point, we somehow have the Fourier coefficients of $f * g$, i.e. $hat(f * g)$, and we need to convert this to $f * g$ efficiently. It might seem like we don't have an "inverse Walsh-Hadamard transform" yet, and it's not immediately obvious how to convert Fourier coefficients to a function in $O(N log N)$ time. Surprisingly, we already have all the tools to compute the inverse Walsh-Hadamard transform.

Let's recall the important theorems we proved last time. In #noteref("walsh-hadamard", <thm-wht>)[the Walsh-Hadamard transform theorem], we showed that $hat(f) = 1/2^n H_(2^n) f$. Furthermore, using #noteref("walsh-hadamard", <hadamard-criterion>)[the criterion for Hadamard matrices], we showed in #noteref("walsh-hadamard", <prop-walsh-hadamard-is-hadamard>)[the proof that the Walsh-Hadamard matrices are Hadamard matrices] that $H_(2^n) H_(2^n)^"T" = 2^n I_(2^n)$. Also, the Walsh-Hadamard matrices are symmetric, so $H_(2^n) = H_(2^n)^"T"$. Can we conclude something from these theorems?

#proposition(title: "Inverse Walsh-Hadamard Transform")[
  Let $f : FF_2^n -> RR$. Then,
  $
    f = H_(2^n) hat(f).
  $
] <prop-inverse-wht>

#proof[
  We start with the Walsh-Hadamard transform, $hat(f) = 1/2^n H_(2^n) f$. Multiplying both sides on the left by $H_(2^n)$ gives
  $
    H_(2^n) hat(f) = 1/2^n H_(2^n) H_(2^n) f.
  $
  Since $H_(2^n)$ is symmetric, $H_(2^n) = H_(2^n)^"T"$, and since $H_(2^n) H_(2^n)^"T" = 2^n I_(2^n)$, the right-hand side simplifies to $1/2^n dot (2^n I_(2^n)) dot f = f$. Therefore, $f = H_(2^n) hat(f)$, as desired. $square$
]

This is quite a remarkable result. Intuitively, this means that the Walsh-Hadamard transform itself is (up to a constant factor) its own inverse! We know that we can compute $H_(2^n) g$ for any $g$ in $O(N log N)$ time, so setting $g = hat(f)$ means we can compute $H_(2^n) hat(f) = f$ in $O(N log N)$ time using the fast Walsh-Hadamard transform.

Cool. Now, it suffices to compute $hat(f * g)$ efficiently. But what is $hat(f * g)$? Let's chase the definition and find out.

First, we will need a helpful lemma.

#lemma(title: "Parity of a Sum")[
  For all $gamma, x, y in FF_2^n$, $chi_gamma (x xor y) = chi_gamma (x) chi_gamma (y)$.
]

The proof of this lemma was left as an exericse in a previous chapter (TODO: add exercises and cite later).

#theorem(title: "XOR Convolution Theorem")[
  For all $gamma in FF_2^n$,
  $
    hat(f * g)(gamma) = 2^n hat(f)(gamma) hat(g)(gamma).
  $
]

#proof[
  The proof follows directly by chasing the definition and applying the facts we know already.
  $
    hat(f * g)(gamma) & = 1/2^n sum_(z in FF_2^n) (f*g)(z) chi_gamma (z) quad & ("Fourier expansion")
  $
]
