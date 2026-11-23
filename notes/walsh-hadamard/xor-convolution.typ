#import "/lib/notes.typ": *
#show: note.with(
  title: "XOR convolution",
  summary: "Application of the fast Walsh-Hadamard transform: recovering the function from Fourier coefficients and efficiently computing the XOR convolution.",
  order: 3,
)

In this chapter, we will explore a practical application of the fast Walsh-Hadamard transform by discussing a fast algorithm for computing the XOR convolution of two functions on $FF_2^n$.

= XOR Convolution

You might recall the word "convolution" from other subjects, such as calculus, where we defined
$
  (f * g)(t) = integral_(-oo)^oo f(tau) g(t - tau) dif tau,
$
or the discrete Fourier transform, where we defined
$
  (A * B)_k = sum_(i=0)^k a_i b_(k-i)
$
for polynomials $A(x) = sum_(i=0)^(m-1) a_i x^i$ and $B(x) = sum_(i=0)^(m-1) b_i x^i$, where the coefficients $a_i$ and $b_i$ with $i >= m$ are taken to be $0$. In all these cases, we are looking for the final "coefficient" or "value" at a certain position when two functions are "multiplied" together.

The same definition seems intuitive for functions $FF_2^n -> RR$, where two inputs in $FF_2^n$ are added with $xor$. In this world, we can also talk about which two vectors sum to a certain desired "index", and compute the final coefficient of the convolution at that index. This motivates the following definition.

#definition(title: "XOR Convolution")[
  Let $f : FF_2^n -> RR$ and $g : FF_2^n -> RR$. The _XOR convolution_ of $f$ and $g$ is the function $f * g : FF_2^n -> RR$ given by
  $
    (f * g)(z) := sum_(x xor y = z) f(x) g(y).
  $
] <def-xor-convolution>

In other words, $(f * g)(z)$ is the sum of all possible values of $f(x) g(y)$ such that $x xor y = z$.

Here is a small interactive widget that shows every product $f(x) g(y)$ for two-bit inputs, grouped by $x xor y$.

#widget("convolution-grid")[
  The interactive grid of products needs JavaScript.
]

A careful reader might observe that this form is not exactly the same as the examples enumerated above. In one of the above examples, we could have also defined $(A * B)_k = sum_(i + j = k) a_i b_j$, but always writing the convolution in this way seems a bit cumbersome to work with.

Interestingly, $xor$ is self-inverse (i.e. $x xor x = 0$) and commutative, so $x xor y = z <==> y = z xor x$. Therefore, we can rewrite the XOR convolution of @def-xor-convolution as follows.

#proposition(title: "Alternative Expression for the XOR Convolution")[
  Let $f, g : FF_2^n -> RR$. For all $z in FF_2^n$,
  $
    (f * g)(z) = sum_(x in FF_2^n) f(x) g(z xor x).
  $
] <prop-xor-convolution-alternative>

The problem is very simple: given functions $f$ and $g$, can we efficiently compute the function $f * g$ (i.e. $(f * g)(z)$ for every $z in FF_2^n$)?

There is an obvious "brute-force" $O(N^2) = O(2^(2n))$ algorithm for doing this, where $N = 2^n$. For each $z in FF_2^n$ and each $x in FF_2^n$, we can compute $f(x) g(z xor x)$ in constant time (we will assume the output values are small), so by @prop-xor-convolution-alternative the entire algorithm takes $O(2^n dot 2^n dot 1) = O(2^(2n)) = O(N^2)$ time. However, our previous discussions on the Walsh-Hadamard transform should convince you that a faster algorithm should exist. In this chapter, we will show that we can in fact reduce XOR convolution to a few calls to #noteref("walsh-hadamard", <thm-fwht>)[the fast Walsh-Hadamard transform], and hence compute $f * g$ in $O(N log N)$ time.

= Fourier Transforming the Convolution

Recall that the Walsh-Hadamard transform computes the Fourier coefficients of a function efficiently. To apply the Walsh-Hadamard transform to the XOR convolution problem, we should consider converting the problem to Fourier coefficient space.

Let's work backwards from what we want to compute. At the end of the algorithm, we need to output the function $f * g$. Ideally, at this point, we somehow have the Fourier coefficients of $f * g$, i.e. $hat(f * g)$, and we need to convert this to $f * g$ efficiently. It might seem like we don't have an "inverse Walsh-Hadamard transform" yet, and it's not immediately obvious how to convert Fourier coefficients to a function in $O(N log N)$ time. Surprisingly, we already have all the tools to compute the inverse Walsh-Hadamard transform.

Let's recall the important theorems we proved last time. In #noteref("walsh-hadamard", <thm-wht>)[the Walsh-Hadamard transform theorem], we showed that $hat(f) = 1/2^n H_(2^n) f$. Furthermore, using #noteref("walsh-hadamard", <hadamard-criterion>)[the criterion for Hadamard matrices], we showed in #noteref("walsh-hadamard", <prop-walsh-hadamard-is-hadamard>)[the proof that the Walsh-Hadamard matrices are Hadamard matrices] that $H_(2^n) H_(2^n)^"T" = 2^n I_(2^n)$. Also, the Walsh-Hadamard matrices are symmetric (by #noteref("walsh-hadamard", <prop-entries>)[the formula for their entries]), so $H_(2^n) = H_(2^n)^"T"$. Can we conclude something from these theorems?

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

This is quite a remarkable result. Intuitively, this means that the Walsh-Hadamard transform itself is (up to a constant factor) its own inverse! We know that we can compute $H_(2^n) v$ for any vector $v$ in $O(N log N)$ time, so setting $v = hat(f)$ means we can compute $H_(2^n) hat(f) = f$ in $O(N log N)$ time using the fast Walsh-Hadamard transform.

Cool. Now, it suffices to compute $hat(f * g)$ efficiently. But what is $hat(f * g)$? Let's chase the definition and find out.

First, we will need a helpful lemma.

#lemma(title: "Parity of a Sum")[
  For all $gamma, x, y in FF_2^n$, $chi_gamma (x xor y) = chi_gamma (x) chi_gamma (y)$.
] <lem-parity-of-a-sum>

This was #noteref("boolean-functions", <exr-parity-of-a-sum>)[an exercise in the chapter on Boolean functions], and the proof is short.

#proof[
  The dot product is linear, so $gamma dot (x xor y) = gamma dot x + gamma dot y$ in $FF_2$. Therefore,
  $
    chi_gamma (x xor y) = (-1)^(gamma dot x + gamma dot y) = (-1)^(gamma dot x) (-1)^(gamma dot y) = chi_gamma (x) chi_gamma (y). quad square
  $
]

#theorem(title: "XOR Convolution Theorem")[
  Let $f, g : FF_2^n -> RR$. For all $gamma in FF_2^n$,
  $
    hat(f * g)(gamma) = 2^n hat(f)(gamma) hat(g)(gamma).
  $
] <thm-xor-convolution>

#proof[
  The proof follows directly by chasing definitions and applying the facts we know already.
  $
    hat(f * g)(gamma) & = 1/2^n sum_(z in FF_2^n) (f*g)(z) chi_gamma (z) & ("Coefficient formula")\
    &= 1/2^n sum_(z in FF_2^n) sum_(x in FF_2^n) f(x) g(z xor x) chi_gamma (z) & ("Alternative expression for " f * g)\
    &= 1/2^n sum_(x in FF_2^n) sum_(z in FF_2^n) f(x) g(z xor x) chi_gamma (z) & ("Swapping finite sums")\
    &= 1/2^n sum_(x in FF_2^n) sum_(y in FF_2^n) f(x) g(y) chi_gamma (x xor y) & ("Let" y := x xor z, "a bijection")\
    &= 1/2^n sum_(x in FF_2^n) sum_(y in FF_2^n) f(x) chi_gamma (x) g(y) chi_gamma (y) & ("Lemma")\
    &= 1/2^n (sum_(x in FF_2^n) f(x) chi_gamma (x))(sum_(y in FF_2^n) g(y) chi_gamma (y)) & ("Factoring")\
    &= 1/2^n (2^n hat(f)(gamma))(2^n hat(g)(gamma)) & ("Coefficient formula")\
    &= 2^n hat(f)(gamma) hat(g)(gamma).
  $
  $square$
]

This is a very clean result. In Fourier coefficient space, the complicated-looking XOR convolution becomes a simple product: to find the coefficient of $f * g$ at $gamma$, we only need the coefficients of $f$ and $g$ at the same $gamma$.

= The Fast Algorithm

Now we have all the pieces of the puzzle. Let's put them together.

#theorem(title: "Fast XOR Convolution")[
  There exists an algorithm that computes the XOR convolution $f * g$ of two functions $f, g : FF_2^n -> RR$ in $O(N log N) = O(n 2^n)$ time.
] <thm-fast-xor-convolution>

#proof[
  The algorithm has three steps, and uses only three calls to the fast Walsh-Hadamard transform.

  + Compute the Fourier coefficients $hat(f)$ and $hat(g)$ using #noteref("walsh-hadamard", <thm-fwht>)[the fast Walsh-Hadamard transform]. This takes $O(N log N)$ time.
  + For every $gamma in FF_2^n$, compute $hat(f * g)(gamma) = 2^n hat(f)(gamma) hat(g)(gamma)$. This is correct by @thm-xor-convolution. The computation for each of the $2^n$ values of $gamma$ takes constant time, so this step takes $O(N)$ time.
  + Compute $f * g = H_(2^n) hat(f * g)$. This is correct by @prop-inverse-wht, and it is one more product with $H_(2^n)$, so the fast Walsh-Hadamard transform does it in $O(N log N)$ time.

  Therefore, the entire algorithm takes $O(N log N + N + N log N) = O(N log N)$ time. $square$
]

In practice, we can tidy up the algorithm a little. Computing $hat(f)$ means computing $H_(2^n) f$ and then dividing every entry by $2^n$, and the same goes for $hat(g)$. It would be nicer to skip these divisions and only divide once at the end. Let $F = H_(2^n) f$ and $G = H_(2^n) g$, so that $hat(f) = 1/2^n F$ and $hat(g) = 1/2^n G$. Then, by @thm-xor-convolution,
$
  hat(f * g)(gamma) = 2^n dot (F(gamma)) / 2^n dot (G(gamma)) / 2^n = 1/2^n F(gamma) G(gamma).
$
Writing $F dot.o G$ for the pointwise product of the two vectors, @prop-inverse-wht gives
$
  f * g = H_(2^n) hat(f * g) = 1/2^n H_(2^n) (F dot.o G).
$
So the simplified algorithm proceeds as follows: transform $f$, transform $g$, multiply $F$ and $G$ pointwise, transform the result, and finally divide by $2^n$.

#example(title: "Convolving on One Bit by Hand")[
  Let $n = 1$, and let $f$ and $g$ have the vectors of values $(1, 2)$ and $(3, 4)$. Directly from @def-xor-convolution,
  $
    (f * g)(0) = f(0) g(0) + f(1) g(1) = 11, quad (f * g)(1) = f(0) g(1) + f(1) g(0) = 10.
  $
  Now let's follow the algorithm. Since $H_2 = mat(delim: "[", 1, 1; 1, -1)$, we get $F = (1 + 2, 1 - 2) = (3, -1)$ and $G = (3 + 4, 3 - 4) = (7, -1)$, so $F dot.o G = (21, 1)$. Transforming once more gives $(21 + 1, 21 - 1) = (22, 20)$, and dividing by $2$ gives $(11, 10)$, which is indeed the correct answer.
]

= Implementation

The simplified algorithm above translates directly into code, assuming the values of $f$ and $g$ are integers. We reuse the function `fwht` from #link("/walsh-hadamard/walsh-hadamard#implementation")[the implementation in the previous chapter], which replaces an array $f$ with $H_(2^n) f$.

```cpp
vector<long long> xor_convolution(vector<long long> f, vector<long long> g) {
    int size = f.size();
    fwht(f);
    fwht(g);
    for (int i = 0; i < size; i++) f[i] *= g[i];
    fwht(f);
    for (int i = 0; i < size; i++) f[i] /= size;
    return f;
}
```

= Conclusion

In this chapter, we defined the XOR convolution $f * g$ and found a fast way to compute it. The Walsh-Hadamard transform is its own inverse up to a factor of $2^n$, so we can move between a function and its Fourier coefficients in $O(N log N)$ time in both directions. In Fourier coefficient space, the XOR convolution is just a product of coefficients. Together, these give an $O(N log N)$ algorithm in place of the $O(N^2)$ brute-force one, where $N = 2^n$.

#remark[
  The XOR convolution theorem follows Section 1.5 of O'Donnell's _Analysis of Boolean Functions_. O'Donnell defines the convolution as an average instead of a sum, which is why the factor $2^n$ does not appear there. See @exr-averaged-convolution for the relationship between the two definitions. The inverse Walsh-Hadamard transform is part (d) of Exercise 1.12 there.

  The algorithm is a standard tool in competitive programming. See, for example, #link("https://codeforces.com/blog/entry/127823")[a Codeforces tutorial on XOR convolution] and
  #link("https://oi-wiki.org/math/poly/fwt/")[OI Wiki's article on the fast Walsh-Hadamard transform].
]

= Exercises

#exercise(title: "XOR Convolution is Commutative")[
  Show that $f * g = g * f$ for all $f, g : FF_2^n -> RR$.
] <exr-commutative>

#exercise(title: "The Identity for XOR Convolution")[
  Let $delta : FF_2^n -> RR$ be the function with $delta(0) = 1$ and $delta(x) = 0$ for all $x != 0$. Show that $f * delta = f$ for every $f : FF_2^n -> RR$. Then compute the Fourier coefficients of $delta$, and check that your answer agrees with @thm-xor-convolution.
] <exr-identity>

#exercise(title: "Averaged Convolution")[
  Define the _averaged convolution_ of $f, g : FF_2^n -> RR$ by
  $
    (f convolve.o g)(z) = EE_x [f(x) g(z xor x)] = 1/2^n sum_(x in FF_2^n) f(x) g(z xor x).
  $
  Show that $hat(f convolve.o g)(gamma) = hat(f)(gamma) hat(g)(gamma)$ for all $gamma in FF_2^n$. Hint: consider #noteref("boolean-functions", <exr-linear>)[the linearity of Fourier coefficients].
] <exr-averaged-convolution>

#exercise(title: "Counting Pairs by XOR")[
  Suppose we are given a list of $m$ integers $a_1, ..., a_m$ with $0 <= a_i < m$ for all $1 <= i <= m$. We would like to output an array $c$ of length $m$, such that for each $0 <= k < m$, $c_(k+1)$ equals the number of pairs $(i, j)$ with $1 <= i, j <= m$ such that $a_i xor a_j = k$. Prove that this problem can be solved in $O(m log m)$ time. For simplicity, you may assume that $m$ is a power of two.

  (Hint: let $f(x)$ be the number of times $x$ appears in the list, and apply what we learned in this chapter.)
] <exr-counting-pairs>
