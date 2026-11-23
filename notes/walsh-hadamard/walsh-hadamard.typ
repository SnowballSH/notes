#import "/lib/notes.typ": *
#show: note.with(
  title: "The Walsh-Hadamard transform",
  summary: "The Walsh-Hadamard matrices, how they give the Fourier coefficients, and a fast algorithm to compute all of them.",
  order: 2,
)

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

We are now ready to enter the world of Walsh-Hadamard transform. We will discuss a simple family of matrices that are closely related to Boolean functions. We will see that, surprisingly, this matrix exposes the Fourier coefficients of any Boolean function.

= Hadamard Matrix

To motivate the definition, recall that in the previous chapter, we repeated applied the idea of orthogonalality of parity functions. In our proofs, often times we can show that most terms in a summation vanish because of interactions between orthogonal parity functions. Let's continue exploiting the idea of orthogonality.

#definition(title: "Hadamard Matrix")[
  A _Hadamard matrix_ is a square matrix with entries in ${-1,1}$ whose rows are mutually orthogonal.
] <def-hadamard-matrix>

This definition seems a bit difficult to work with, so let us prove an alternative criterion for Hadamard matrices.

#proposition(title: "Criterion for Hadamard Matrices")[
  Let $H$ be an $N times N$ matrix with entries in ${-1, 1}$. Then, $H$ is a Hadamard matrix if and only if $H H^"T" = N I_N$.
] <hadamard-criterion>

#proof[
  Write $H[i]$ for the $i$-th row of $H$, viewed as a vector. Let $H$ be an $N times N$ Hadamard matrix. Then,
  $
    (H H^"T") [i, j] = H[i] dot H[j].
  $
  We know that for all $i != j$, the $i$-th and $j$-th rows of $H$ are orthogonal. Therefore, the dot product is zero whenever $i != j$. Also, for any entry $x$ in $H$, we have $x in {-1,1}$, so $x^2 = 1$, which yields
  $
    H[i] dot H[i] = N dot 1 = N.
  $

  Therefore,
  $
    (H H^"T") [i, j] = cases(N & quad "if" i = j, 0 & quad "otherwise"),
  $
  so $H H^"T" = N I_N$.

  Conversely, if $H H^"T" = N I_N$, then for any $i != j$, we have
  $
    H[i] dot H[j] = (H H^"T") [i, j] = (N I_N) [i, j] = 0,
  $
  so the rows of $H$ are mutually orthogonal, and hence $H$ is a Hadamard matrix. $square$
]

= The Walsh-Hadamard Matrices

Now, it's still not very clear how to construct a family of such matrices. Fortunately, there is a simple recursively defined family of matrices that might fit the above definition.

#definition(title: "The Walsh-Hadamard Matrices")[
  The _Walsh-Hadamard matrices_ $(H_(2^n))_(n >= 0)$ are a sequence of matrices defined recursively, with $H_1 = [1]$ and
  $
    H_(2^(n+1)) = mat(delim: "[", H_(2^n), H_(2^n); H_(2^n), -H_(2^n))
  $
  for all integers $n >= 0$.
]

#gallery(columns: 4, ..range(0, 8).map(tiling))

Here is a small interactive widget that shows the construction of the matrix, where a white cell indicates a $1$ and a black cell indicates a $-1$.

#widget("hadamard-tiling", start: 1, max: 6)[
  The interactive tiling needs JavaScript.
]

Interestingly, families of Hadamard matrices were actually first constructed by James Joseph Sylvester in 1867 under the name of anallagmatic pavements, 26 years before Hadamard (1893) considered them.

The rows of the Walsh-Hadamard matrices, when viewed as Boolean functions, were used by electrical engineers in the 1890s to find transpositions of wires that minimized crosstalk, and Walsh introduced the idea formally into mathematics in 1923.

Despite their name, it is not entirely obvious that the Walsh-Hadamard matrices are even Hadamard matrices. We can show that this is indeed true.

#proposition(title: "The Walsh-Hadamard Matrices are Hadamard Matrices")[
  For all $n >= 0$, $H_(2^n)$ is a Hadamard matrix.
] <prop-walsh-hadamard-is-hadamard>

Intuitively, this is true by induction: every row is just two copies of a row in the previous matrix in the sequence, with the second copy potentially multiplied by $-1$. Take two different rows $r_1$ and $r_2$. If they come from two different rows of the previous matrix, then the first halves of $r_1$ and $r_2$ are orthogonal inductively, and the second halves of $r_1$ and $r_2$ are also orthogonal inductively. If they come from the same row of the previous matrix, then their first halves are equal and their second halves are negatives of each other, so the contributions of the two halves to the dot product cancel. We can prove this more rigorously.

#proof[
  By @hadamard-criterion, it suffices to show that $H_(2^n) H_(2^n)^"T" = 2^n I_(2^n)$ for all $n >= 0$.

  We proceed by induction on $n$.

  For the base case $n=0$, $H_1 = [1]$ has $H_1 H_1^"T" = [1] = 1 dot I_1$.

  For the inductive case, let $n >= 0$. Taking the transpose block by block, we have
  $
    H_(2^(n+1))^"T" = mat(delim: "[", H_(2^n)^"T", H_(2^n)^"T"; H_(2^n)^"T", -H_(2^n)^"T").
  $
  Therefore, by blocking, we have
  $
    H_(2^(n+1)) H_(2^(n+1))^"T" & = mat(
                                    delim: "[",
                                    H_(2^n) H_(2^n)^"T" + H_(2^n) H_(2^n)^"T", H_(2^n) H_(2^n)^"T" - H_(2^n) H_(2^n)^"T";
                                    H_(2^n) H_(2^n)^"T" - H_(2^n) H_(2^n)^"T", H_(2^n) H_(2^n)^"T" + H_(2^n) H_(2^n)^"T"
                                  ) \
                                & = 2 dot mat(delim: "[", H_(2^n) H_(2^n)^"T", 0; 0, H_(2^n) H_(2^n)^"T") \
                                & = 2 dot mat(delim: "[", 2^n I_(2^n), 0; 0, 2^n I_(2^n)) \
                                & = 2^(n+1) I_(2^(n+1)).
  $

  Therefore, $H_(2^n) H_(2^n)^"T" = 2^n I_(2^n)$ for all $n >= 0$, which means they are all Hadamard matrices. $square$
]

Let us analyze the entries of the Walsh-Hadamard matrices. Before doing so, we notice that the indices are very large, from $1$ to $2^n$.

Furthermore, when analyzing row $i$ of $H_(2^n)$, we would like to case on whether $i$ is in the first or second half of the indices, because the definition of the row differs in the recursive definition based on which half $i$ is in. Casing on whether $i <= 2^(n-1)$ and constructing the sub-index $i' = i$ in the first case and $i' = i - 2^(n-1)$ in the second seems quite annoying and unintuitive.

But not all hope is lost, and a natural but interesting idea surfaces. First, we will use zero-based indexing, so the indices for the rows and columns of $H_(2^n)$ are from $0$ to $2^n - 1$. For an index $i in {0, 1, ..., 2^n - 1}$, let us write $i$ as a sequence of bits: $arrow(i) = (i_0, i_1, ..., i_(n-1))$, where $i_0$ is the least significant bit and $i_(n-1)$ is the most significant bit. For example, if $i=6$ and $n=3$, we can write $arrow(i) = (0, 1, 1)$, since $6_(10) = 110_2$.

With this notation, given an index $arrow(i) = (i_0, i_1, ..., i_(n-1))$, to get the index $i'$ for the submatrix from the previous iteration of the recursive definition, we can simply drop the most significant bit and write
$
  arrow(i)' = (i_0, i_1, ..., i_(n-2)).
$

Furthermore, this notation allows us to view indices as vectors in $FF_2^n$ as well, which seems to match closely with the topic of Boolean functions. The coordinates were numbered from $1$ in the previous chapter and are numbered from $0$ here, so the bit $i_k$ is coordinate $k + 1$.

With this idea, let us prove a crucial property about the entries of the Walsh-Hadamard matrices.

#proposition(title: "Entries of the Walsh-Hadamard Matrices")[
  Let $n$ be a nonnegative integer and $gamma, x in {0, 1, ..., 2^n-1}$ be zero-based indices. Then, the $(gamma, x)$-th entry of the Walsh-Hadamard matrix $H_(2^n)$ is given by
  $
    H_(2^n) [gamma, x] = (-1)^(arrow(gamma) dot arrow(x)),
  $
  where $arrow(gamma) dot arrow(x)$ is the dot product of $arrow(gamma)$ and $arrow(x)$ when $x$ and $gamma$ are viewed as vectors in $FF_2^n$ using their binary representations.
] <prop-entries>

#proof[
  We proceed by induction on $n$.

  For the base case $n=0$, the only entry is $H_1 [0, 0] = 1 = (-1)^0$, since the dot product of two empty vectors is $0$.

  For the inductive case, let $n >= 0$. We will show that for any $gamma, x in {0, 1, ..., 2^(n+1)-1}$, we have $H_(2^(n+1)) [gamma, x] = (-1)^(arrow(gamma) dot arrow(x))$.

  First, write $arrow(gamma) = (gamma_0, gamma_1, ..., gamma_n) in FF_2^(n+1)$ and $arrow(x) = (x_0, x_1, ..., x_n) in FF_2^(n+1)$ in the format described above, and view them as vectors in $FF_2^(n+1)$.

  Let $arrow(gamma)' = (gamma_0, gamma_1, ..., gamma_(n-1)) in FF_2^n$ and $arrow(x)' = (x_0, x_1, ..., x_(n-1)) in FF_2^n$ be $arrow(gamma)$ and $arrow(x)$ with the most significant bit dropped. Let $gamma', x'$ be their representations in ${0, 1, ..., 2^n - 1}$, respectively. There are two cases:

  *Case 1.* If $gamma_n = 0$ or $x_n = 0$, then the entry $H_(2^(n+1)) [gamma, x]$ was defined in $H_(2^n)$ at index $(gamma', x')$, so
  $
    H_(2^(n+1)) [gamma, x] = H_(2^n) [gamma', x'].
  $
  By the inductive hypothesis, $H_(2^n) [gamma', x'] = (-1)^(arrow(gamma)' dot arrow(x)')$. Note that because $gamma_n = 0$ or $x_n = 0$, we have $gamma_n dot x_n = 0$, so
  $
    arrow(gamma) dot arrow(x) = arrow(gamma)' dot arrow(x)' + gamma_n dot x_n = arrow(gamma)' dot arrow(x)'.
  $
  Therefore,
  $
    H_(2^(n+1)) [gamma, x] = H_(2^n) [gamma', x'] = (-1)^(arrow(gamma)' dot arrow(x)') = (-1)^(arrow(gamma) dot arrow(x)).
  $

  *Case 2.* If $gamma_n = x_n = 1$, then the entry $H_(2^(n+1)) [gamma, x]$ was defined in $-H_(2^n)$ at index $(gamma', x')$, so
  $
    H_(2^(n+1)) [gamma, x] = -H_(2^n) [gamma', x'].
  $
  By the inductive hypothesis, $H_(2^n) [gamma', x'] = (-1)^(arrow(gamma)' dot arrow(x)')$. Note that because $gamma_n = x_n = 1$, we have $gamma_n dot x_n = 1$, so
  $
    arrow(gamma) dot arrow(x) = arrow(gamma)' dot arrow(x)' + gamma_n dot x_n = arrow(gamma)' dot arrow(x)' + 1.
  $
  Therefore,
  $
    H_(2^(n+1)) [gamma, x] = -H_(2^n) [gamma', x'] = (-1)^(arrow(gamma)' dot arrow(x)' + 1) = (-1)^(arrow(gamma) dot arrow(x)). quad square
  $
]

Since $arrow(gamma) dot arrow(x) = arrow(x) dot arrow(gamma)$, this formula shows in particular that $H_(2^n)$ is symmetric.

This is an amazing result, because it reminds us of the idea of parity functions. The entry $H_(2^n) [gamma, x] = (-1)^(arrow(gamma) dot arrow(x))$ is precisely $chi_(arrow(gamma)) (arrow(x))$ from the previous chapter, the parity of the bits of $x$ selected by $gamma$! This observation yields the following theorem, the Walsh-Hadamard transform.

#theorem(title: "Walsh-Hadamard Transform (WHT)")[
  Let $f : FF_2^n -> RR$, and view $f$ and $hat(f)$ as column vectors indexed by $FF_2^n$ vectors. Then,
  $
    hat(f) = 1/2^n H_(2^n) f.
  $
] <thm-wht>

#proof[
  For any $gamma in FF_2^n$, using #noteref("boolean-functions", <prop-coefficient-formula>)[the formula for the Fourier coefficients] from the previous chapter in the last step, we have
  $
    & (1/2^n H_(2^n) f) [gamma] \
    & = 1/2^n sum_(x in FF_2^n) H_(2^n) [gamma, x] f(x) &             quad "(matrix multiplication)" \
    & = 1/2^n sum_(x in FF_2^n) (-1)^(gamma dot x) f(x) &                 quad "(above proposition)" \
    & = 1/2^n sum_(x in FF_2^n) chi_gamma (x) f(x)      &         quad "(definition of" chi_gamma")" \
    & = chevron.l chi_gamma, f chevron.r \
    & = hat(f) (gamma).                                 & quad "(proposition from previous chapter)" \
  $

  Therefore, $hat(f) = 1/2^n H_(2^n) f$, as desired. $square$
]

= Efficiently Computing the Fourier Expansion

Recall that in the previous chapter, we showed that we can compute the Fourier expansion of a function $f : {-1,1}^n -> RR$ by writing
$
  f(x) = 1/2^n sum_(alpha in {-1, 1}^n) f(alpha) product_(i=1)^n (1 + alpha_i x_i).
$

Let's analyze the time complexity of this naive method. We will assume that we are given as input the output (a relatively small number) on each of the $2^n$ inputs. Therefore, the input consists of $2^n$ small numbers, so it is convenient to write $N = "length of input" = 2^n$.

#proposition(title: "Time Complexity of the Naive Method")[
  The naive method of computing the Fourier expansion of a function $f : {-1, 1}^n -> RR$ takes $O(N^2) = O(2^(2n))$ time.
]

#proof[
  Let's consider one (summation) iteration of the algorithm. We compute the product of $n$ binomials. While doing so, at the $k$-th iteration of the product loop, the polynomial can hold $2^k$ terms (the number of terms doubles with every binomial multiplication), so the total cost of the product loop is $sum_(k=1)^n 2^k = O(2^n)$.

  The outer summation iteration iterates through $2^n$ values of input $alpha$. Summing $2^n$ multilinear polynomials each with $2^n$ terms takes $O(2^n dot 2^n)$.

  Therefore, the total time cost of the algorithm is $O(2^n dot 2^n + 2^n dot 2^n) = O(2^(2n)) = O(N^2)$. $square$
]

The formula for the Fourier coefficients from the previous chapter is no faster, since each of the $2^n$ coefficients is an average over $2^n$ inputs.

For real-world scenarios where $n >= 20$, this algorithm is hopelessly slow.

Fortunately, it seems like our Walsh-Hadamard transform is very sophisticated, and perhaps it can compute the Fourier expansion with less time cost?

We can use the Walsh-Hadamard transform to reduce the problem of Fourier expansion to computing the vector $H_(2^n) f$. Unfortunately, $H_(2^n)$ has dimensions $2^n times 2^n$, so it seems that using normal matrix-vector multiplication algorithms, this would take $O(2^(2n)) = O(N^2)$ time, which is no better than the naive algorithm.

Again, not all hope is lost. The matrices $H_(2^n)$ are defined recursively using only two different kinds of matrices from the previous iteration, so there may be some structure that allows us to cleverly compute $H_(2^n) f$ without bashing out the entire multiplication.

#theorem(title: "Fast Walsh-Hadamard Transform (FWHT)")[
  There exists an algorithm (using the WHT) that computes the Fourier expansion of a function $f : FF_2^n -> RR$ in $O(N log N) = O(n 2^n)$ time.
] <thm-fwht>

#proof[
  The algorithm is based on divide and conquer, splitting $f$ into two equal halves, recursively solving each half, then efficiently combining the answers.

  Explicitly, the algorithm takes in $2^n$ small outputs for the $2^n$ inputs using an input of length $N = 2^n$. It outputs $2^n$ coefficients representing the Fourier coefficients of each of the $2^n$ subsets.

  To do this, it suffices to compute the vector $H_(2^n) f$.

  The base case is when $n = 0$. For the zero-arity function $f : FF_2^0 -> RR$, if $f() = a$, since $H_1 = [1]$, we simply have $H_1 f = [a]$. This is computed in $O(1)$ time.

  For the recursive case, suppose $n >= 1$. Let $f : FF_2^n -> RR$.

  Define $f_0, f_1 : FF_2^(n-1) -> RR$ by
  $
    f_0 (x_0, ..., x_(n-2)) & = f(x_0, ..., x_(n-2), 0), \
    f_1 (x_0, ..., x_(n-2)) & = f(x_0, ..., x_(n-2), 1).
  $
  Since the last coordinate is the most significant bit of the index, $f_0$ is the first half of the vector $f$ and $f_1$ is the second half.

  We will recursively compute the vectors $v_0 = H_(2^(n-1)) f_0$ and $v_1 = H_(2^(n-1)) f_1$.

  By blocking, we see that
  $
    H_(2^n) f & = mat(delim: "[", H_(2^(n-1)), H_(2^(n-1)); H_(2^(n-1)), -H_(2^(n-1))) vec(f_0, f_1) \
              & = vec(H_(2^(n-1)) f_0 + H_(2^(n-1)) f_1, H_(2^(n-1)) f_0 - H_(2^(n-1)) f_1) \
              & = vec(v_0 + v_1, v_0 - v_1).
  $

  Hence the merge step only involves adding and subtracting the vectors $v_0$ and $v_1$ in $RR^(2^(n-1))$ and concatenating the results to form a vector in $RR^(2^n)$, which can be done in $O(2^n)$ time.

  After computing $H_(2^n) f$, we can multiply every entry of this vector by $1/(2^n)$ in $O(2^n)$ time to obtain the full set of Fourier coefficients of $f$.

  Let's analyze the work bounds for this algorithm. For any $n >= 1$, the work $W(2^n)$ of this algorithm follows the recurrence
  $
    W(1) = O(1), quad W(2^n) = 2 W(2^(n-1)) + O(2^n).
  $

  Since $2^(n-1) + 2^(n-1) = 2^n$, the recursion tree is balanced with $log_2 (2^n) = n$ levels, and each level costs $O(2^n)$ in total, so
  $
    W(2^n) = O(n dot 2^n), quad "that is," quad W(N) = O(N log N). quad square
  $
]

= Implementation

The proof of @thm-fwht is already an algorithm, so let's turn it into code. We store $f$ as an array of length $N = 2^n$, where the index $x$, read in binary, holds $f(x)$. The function below replaces this array with $H_(2^n) f$.

```cpp
void fwht(vector<long long>& f) {
    int size = f.size();
    for (int half = 1; half < size; half *= 2) {
        for (int start = 0; start < size; start += 2 * half) {
            for (int j = start; j < start + half; j++) {
                long long u = f[j], v = f[j + half];
                f[j] = u + v;
                f[j + half] = u - v;
            }
        }
    }
}
```

The proof works from the top down, i.e., it splits the array into two halves, recurses on each half, then merges. The code does the same merges from the bottom up, which avoids the recursion. It first merges blocks of size $1$ into blocks of size $2$, then blocks of size $2$ into blocks of size $4$, and so on, until the whole array is one block.

Here is a small interactive widget that runs the code on eight values, one round of the outer loop at a time.

#widget("fwht-butterfly")[
  The interactive diagram of the fast transform needs JavaScript.
]

A block of size $1$ is already its own transform, since $H_1 = [1]$. Whenever the code merges two neighboring blocks of size `half`, each of them already holds its own transform, and they play the roles of $v_0$ and $v_1$ in the proof. The innermost loop then overwrites them with $v_0 + v_1$ and $v_0 - v_1$, one entry at a time, exactly as in the proof. This happens in place, so the code needs no extra memory.

The outer loop runs $n$ times, once for each level of the recursion, and each round touches every entry of the array once. The running time is therefore $O(n 2^n) = O(N log N)$, which agrees with @thm-fwht. The code assumes that the values of $f$ are integers, so every entry stays an integer. To obtain the Fourier coefficients of $f$, we divide every entry of the result by $N$, which may no longer give integers.

= Conclusion

In this chapter, we defined the Walsh-Hadamard matrices $H_(2^n)$ recursively and showed that they are Hadamard matrices. Their entries are $(-1)^(arrow(gamma) dot arrow(x))$, which are exactly the values of the parity functions, so multiplying the vector of values of $f$ by $H_(2^n)$ and dividing by $2^n$ gives the Fourier coefficients of $f$. Finally, the recursive structure of $H_(2^n)$ lets us compute this product in $O(N log N)$ time instead of $O(N^2)$, where $N = 2^n$.

#remark[
  The definition of Hadamard matrices, the criterion $H H^"T" = N I_N$, the history of Sylvester and Hadamard, and the recursive construction are from #link("https://mathworld.wolfram.com/HadamardMatrix.html")[MathWorld's article on Hadamard matrices]. The history of the Walsh functions is from #link("https://mathworld.wolfram.com/WalshFunction.html")[MathWorld's article on Walsh functions].

  The formula for the entries of the Walsh-Hadamard matrices, the Walsh-Hadamard transform and the fast Walsh-Hadamard transform are parts (a) to (c) of Exercise 1.12 of O'Donnell's _Analysis of Boolean Functions_.
]

= Exercises

#exercise(title: "The Walsh-Hadamard Matrices are Symmetric")[
  Show that $H_(2^n)^"T" = H_(2^n)$ for all $n >= 0$ by induction, using only the recursive definition.
] <exr-symmetric>

#exercise(title: "Balanced Rows")[
  Let $n >= 1$. Show that every row of $H_(2^n)$ other than the first has exactly $2^(n-1)$ entries equal to $1$ and $2^(n-1)$ entries equal to $-1$.
] <exr-balanced-rows>

#exercise(title: "Transform of a Parity Function")[
  Let $gamma in FF_2^n$. Compute the vector $H_(2^n) chi_gamma$, and use it to read off the Fourier coefficients of $chi_gamma$.
] <exr-transform-of-parity>
