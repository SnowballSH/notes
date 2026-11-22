#import "/lib/notes.typ": *
#show: note.with(
  title: "Quantum oracles and Fourier sampling",
  summary: "The query model of computation, the sign oracle, and Fourier sampling.",
  order: 5,
)

#let ket(x) = $lr(| #x chevron.r)$
#let Hn = $H^(times.o n)$
#let Opm = $O_f^plus.minus$

In the previous chapter, we saw that applying a Hadamard gate to every qubit transforms the amplitudes of a state into its Fourier coefficients (up to a factor). This is only useful if the amplitudes mean something to begin with. In this chapter, we will see how to load a function into the amplitudes of a state using a single query, so that the Hadamard gates tell us something about the function.

= The Query Model

In the problems we will be discussing, we are given an unknown function $f : FF_2^n -> FF_2$ and asked a question about it. We are not told how $f$ is computed. The only thing we can do with $f$ is to evaluate it at some points.

#definition(title: "Query Model")[
  In the _query model_, an algorithm can only learn about an unknown function $f$ by evaluating it. Each evaluation is called a _query_, and the _query complexity_ of an algorithm is the number of queries it makes.
] <def-query-model>

You can think of $f$ as a black box, which is often called an _oracle_: we ask it a question, and it gives us an answer. In this model, we do not count the running time of an algorithm, only the number of questions it asks. This makes algorithms much easier to compare, and for the algorithms we will see, the number of queries is what matters the most anyway.

Let's look at an example of a problem in the query model, on a classical computer.

#example(title: "Finding a Hidden Parity Function Classically")[
  Suppose we are promised that $f(x) = sigma dot x$ for some unknown $sigma in FF_2^n$, and we would like to find $sigma$. This is known as the _Bernstein-Vazirani problem_.

  We can query the inputs with a single $1$. For example, when $n = 3$,
  $
    f(100) = sigma_1, quad f(010) = sigma_2, quad f(001) = sigma_3,
  $
  so three queries reveal $sigma$. In general, this takes $n$ queries.

  Intuitively, we cannot hope to do better, since each query gives us a single bit of information, and $sigma$ has $n$ bits. This intuition is correct: the answers to $k$ queries are $k$ bits, so they can take at most $2^k$ different values, and a deterministic algorithm that sees the same answers must give the same output. Since there are $2^n$ possible values of $sigma$, a deterministic algorithm that always finds $sigma$ needs at least $n$ queries in the worst case. Randomness does not help: an algorithm that is always correct stays correct when its random choices are fixed in advance. But while we are talking about quantum computation, perhaps we all need to free our minds from the classical model of computation.
] <ex-classical-parity>

Keep this example in mind. By the end of this chapter, we will show that a quantum computer can solve the same problem with a single query.

= Querying a Function with a Gate

How does a quantum computer make a query? Recall that the only thing we are allowed to do to a state, besides measuring it, is to apply #noteref("qubits", <def-gate>)[a gate]. Therefore, the query itself has to be a gate.

Let us try to formally define a query that asks for the value of $f(x)$. The first idea that comes to mind is to define it as a gate that sends $ket(x)$ to $ket(f(x))$. Let's be a bit careful here. Is this actually a gate?

#example(title: "A Query That is Not a Gate")[
  Let $f$ be the AND of two bits, $f(x) = x_1 x_2$, so that
  $
    f(00) = f(01) = f(10) = 0, quad f(11) = 1.
  $
  The proposed "gate" sends the three two-qubit states $ket(00)$, $ket(01)$, and $ket(10)$ all to the same one-qubit state $ket(0)$.

  This is not a gate. Every gate $U$ can be undone by applying $U^dagger$, since $U^dagger U = I$. However, once three different states have been sent to $ket(0)$, there is no way to tell which one we started with, so this operation cannot be undone.
] <ex-not-a-gate>

Unfortunately, the same problem appears for every function on $n >= 2$ bits, because $f$ sends $2^n$ different inputs to only two different outputs. We need a way to query $f$ without forgetting the input $x$.

Here is a second idea. We keep $ket(x)$ exactly where it is, and we record the answer $f(x)$ in the sign of its amplitude.

#definition(title: "Sign Oracle")[
  Let $f : FF_2^n -> FF_2$. The _sign oracle_ of $f$ is the gate $Opm$ on $n$ qubits with
  $
    Opm ket(x) = (-1)^(f(x)) ket(x)
  $
  for every $x in FF_2^n$.
] <def-sign-oracle>

In other words, the sign oracle leaves $ket(x)$ alone when $f(x) = 0$, and negates it when $f(x) = 1$. As a matrix, $Opm$ is a diagonal matrix, and the diagonal entry at index $x$ is $(-1)^(f(x))$.

The sign $(-1)^(f(x))$ should look familiar. Recall that in #link("/walsh-hadamard/boolean-functions")[the chapter on Boolean functions], we wrote a bit $b$ as the sign $(-1)^b$, so that $0$ becomes $1$ and $1$ becomes $-1$. The sign oracle uses exactly this encoding. To avoid confusion between the two encodings, we will use two different letters throughout this chapter: $f$ is the function with values in ${0, 1}$, and $g(x) = (-1)^(f(x))$ is the same function with values in ${-1, 1}$.

#example(title: "The Sign Oracle of AND")[
  Let $f(x) = x_1 x_2$ again. Then $g(00) = g(01) = g(10) = 1$ and $g(11) = -1$. We list the basis states in the order $00, 01, 10, 11$, which are the indices $0, 1, 2, 3$ written in binary. Writing the sign oracle of $f$ in matrix form, we have
  $
    Opm = mat(delim: "[", 1, 0, 0, 0; 0, 1, 0, 0; 0, 0, 1, 0; 0, 0, 0, -1).
  $
  Applying it to a state negates the amplitude of $ket(11)$ and changes nothing else. Unlike the previous attempt, no two inputs are sent to the same state, so the input is not forgotten.
] <ex-sign-oracle-and>

Once again, we have been calling the sign oracle a "gate" without proving that it is one. Fortunately, unlike our first attempt at a query, the sign oracle is actually a gate, and the proof is short.

#proposition(title: "The Sign Oracle is a Gate")[
  For every $f : FF_2^n -> FF_2$, the sign oracle $Opm$ is a gate.
] <prop-sign-oracle-is-a-gate>

#proof[
  $Opm$ is a real diagonal matrix, so $(Opm)^dagger = (Opm)^"T" = Opm$. Therefore, $(Opm)^dagger Opm$ is the diagonal matrix whose diagonal entry at index $x$ is
  $
    (-1)^(f(x)) dot (-1)^(f(x)) = 1,
  $
  which means $(Opm)^dagger Opm = I$. $square$
]

Now, we have a good way to define queries used by a quantum algorithm. In the query model, a quantum algorithm is given the gate $Opm$ as a black box, and each use of $Opm$ counts as one query.

#remark(title: "Other Oracles")[
  The more common way to turn $f$ into a gate keeps $x$ and adds $f(x)$ to one extra qubit instead of using a sign. One use of that gate, with the extra qubit prepared in the state $ket(-)$, acts exactly like the sign oracle, so every algorithm in these notes makes the same number of queries with either one. We omit the details, which are in Section 2.3 of Lecture 4 of O'Donnell and Wright's _Quantum Computation_ lecture notes.
]

= Querying Every Input at Once

Since the sign oracle is a gate, it is linear, so nothing stops us from applying it to a combination of many inputs.

In fact, to get any useful information out of a query, we kind of have to. On a single basis state, the sign oracle is useless, since $ket(x)$ and $-ket(x)$ both output $x$ with $100%$ probability when measured. The sign only becomes meaningful when several inputs are present together.

Let's try the most obvious combination. Recall from the previous chapter that applying #noteref("qubits", <prop-hadamard-gates>)[the Hadamard gates] to $ket(0)$, where $0 in FF_2^n$ is the all-zeros bitstring, gives the uniform superposition
$
  Hn ket(0) = 1/sqrt(2^n) sum_(x in FF_2^n) ket(x),
$
which contains every possible input. Let's see what happens if we query this combination.

#proposition(title: "One Query Loads the Function")[
  Let $f : FF_2^n -> FF_2$ and $g(x) = (-1)^(f(x))$. Then,
  $
    Opm Hn ket(0) = 1/sqrt(2^n) sum_(x in FF_2^n) g(x) ket(x).
  $
] <prop-loading>

#proof[
  By linearity and @def-sign-oracle,
  $
    Opm Hn ket(0) = 1/sqrt(2^n) sum_(x in FF_2^n) Opm ket(x) = 1/sqrt(2^n) sum_(x in FF_2^n) (-1)^(f(x)) ket(x) = 1/sqrt(2^n) sum_(x in FF_2^n) g(x) ket(x). quad square
  $
]

This looks too good to be true. With a single query, we obtained a state that contains all $2^n$ values of $f$! Did we just evaluate $f$ on every input at once?

Let's be a bit careful again. The values of $f$ are in the amplitudes of the state, but remember that we cannot directly inspect amplitudes... All we can do is measure.

A careful reader might notice that every amplitude has the same magnitude. This is not good, because when we measure a state, the answer we get only depends on the magnitudes of the amplitudes. Let's look at a concrete example.

#example(title: "Measuring Too Early")[
  Let $f(x) = x_1 x_2$ once more. By @prop-loading and @ex-sign-oracle-and, after one query the state is
  $
    1/2 ket(00) + 1/2 ket(01) + 1/2 ket(10) - 1/2 ket(11).
  $
  Measuring it outputs each of the four bitstrings with probability $(plus.minus 1/2)^2 = 1/4$.

  Unfortunately, this is a uniformly random bitstring. The measurement tells us nothing about $f$ at all.
] <ex-measuring-too-early>

The key reason measuring now doesn't work is that the values of $f$ are stored in the signs, but a measurement cannot see signs. We have been in this situation before: in #noteref("qubits", <ex-fair-coins>)[the example of the two fair coins], the states $ket(+)$ and $ket(-)$ differed only by a sign, and measuring could not tell them apart.

Fortunately, remember that a Hadamard gate can tell them apart: $H ket(+) = ket(0)$ by #noteref("qubits", <ex-unflipping>)[the example of unflipping a coin], and similarly $H ket(-) = ket(1)$, so measuring after applying $H$ outputs $0$ for $ket(+)$ and $1$ for $ket(-)$. Let's do the same thing here, and we call this technique _Fourier sampling_.

= Fourier Sampling

We can apply the Hadamard gates one more time before measuring. We saw in the previous chapter that they turn the amplitudes of a state into its Fourier coefficients, up to a factor, and here is the precise statement for the state we have.

#theorem(title: "Hadamard Gates Compute the Fourier Coefficients")[
  Let $g : FF_2^n -> {-1, 1}$. Then,
  $
    Hn (1/sqrt(2^n) sum_(x in FF_2^n) g(x) ket(x)) = sum_(gamma in FF_2^n) hat(g)(gamma) ket(gamma).
  $
] <thm-hadamard-computes-coefficients>

#proof[
  As a column vector, the state on the left-hand side is $1/sqrt(2^n) g$, where we view $g$ as its vector of values. Recall that $Hn = 1/sqrt(2^n) H_(2^n)$ (#noteref("qubits", <thm-hadamard-gates>)[the Hadamard gates are the Walsh-Hadamard matrices]) and that $hat(g) = 1/2^n H_(2^n) g$ (#noteref("walsh-hadamard", <thm-wht>)[the Walsh-Hadamard transform theorem]). Therefore,
  $
    Hn (1/sqrt(2^n) g) = 1/sqrt(2^n) H_(2^n) (1/sqrt(2^n) g) = 1/2^n H_(2^n) g = hat(g).
  $
  This is the column vector whose entry at index $gamma$ is $hat(g)(gamma)$, which is the state on the right-hand side. $square$
]

The amplitudes of the new state are exactly the Fourier coefficients of $g$. Since the result of measuring a state depends on the amplitudes, this theorem tells us we can extract information about $f$ by measuring the new state.

Putting everything together, we arrive at the main procedure of this chapter.

#definition(title: "Fourier Sampling")[
  Let $f : FF_2^n -> FF_2$. _Fourier sampling_ is the following procedure on $n$ qubits.

  + Start with the state $ket(0)$, the basis state of the all-zeros bitstring.
  + Apply $Hn$.
  + Apply the sign oracle $Opm$.
  + Apply $Hn$.
  + Measure.
] <def-fourier-sampling>

Here is the procedure drawn as a circuit.

#widget("circuit", kind: "fourier-sampling")[
  The circuit applies $Hn$, then the sign oracle $Opm$, then $Hn$ again, and measures every qubit.
]

#theorem(title: "Fourier Sampling")[
  Let $f : FF_2^n -> FF_2$ and $g(x) = (-1)^(f(x))$. Fourier sampling makes one query, and it outputs the bitstring $gamma in FF_2^n$ with probability $hat(g)(gamma)^2$.
] <thm-fourier-sampling>

#proof[
  The sign oracle is used exactly once in the third step, so exactly one query is used.

  By @prop-loading, the state after the third step is $1/sqrt(2^n) sum_(x in FF_2^n) g(x) ket(x)$. By @thm-hadamard-computes-coefficients, the state after the fourth step is $sum_(gamma in FF_2^n) hat(g)(gamma) ket(gamma)$. Finally, by the definition of #noteref("qubits", <def-measurement>)[measurement], the last step outputs $gamma$ with probability $hat(g)(gamma)^2$. $square$
]

#remark(title: "Parseval's Theorem Appears Again")[
  The probabilities of all the outcomes must sum to $1$, so @thm-fourier-sampling tells us that $sum_(gamma in FF_2^n) hat(g)(gamma)^2 = 1$. This is precisely #noteref("boolean-functions", <thm-plancherel>)[Parseval's theorem] from the chapter on Boolean functions.
]

Before we get too excited, note that we still do not get to read the Fourier coefficients. Each run outputs a single bitstring $gamma$, and a $gamma$ whose coefficient is larger in magnitude is more likely to appear. If we want a second sample, we have to run the entire procedure again, which costs a second query. It seems like, in general, we need many more queries to be confident about all the coefficients...

Is a single sample of any use? It depends on the function. Let's see two examples, one disappointing and one remarkable.

#example(title: "Fourier Sampling the AND of Two Bits")[
  Let $f(x) = x_1 x_2$ one last time. As a column vector, the state in @ex-measuring-too-early is $1/2 (1, 1, 1, -1)$. Applying $H^(times.o 2) = 1/2 H_4$ gives
  $
    1/2 mat(delim: "[", 1, 1, 1, 1; 1, -1, 1, -1; 1, 1, -1, -1; 1, -1, -1, 1) dot 1/2 mat(delim: "[", 1; 1; 1; -1) = 1/4 mat(delim: "[", 2; 2; 2; -2) = mat(delim: "[", 1\/2; 1\/2; 1\/2; -1\/2).
  $
  These are precisely the Fourier coefficients of $g$, which we can read off from #noteref("boolean-functions", <ex-and>)[the Fourier expansion of AND] in the chapter on Boolean functions.

  Measuring outputs each of the four bitstrings with probability $1/4$. Unfortunately, this is again a uniformly random bitstring. The Fourier coefficients of AND are spread out evenly, so a sample tells us nothing.
] <ex-sampling-and>

#example(title: "Finding a Hidden Parity Function with One Query")[
  Let's return to @ex-classical-parity, where $f(x) = sigma dot x$ for an unknown $sigma in FF_2^n$. Then
  $
    g(x) = (-1)^(sigma dot x) = chi_sigma (x),
  $
  so $g$ is a parity function. Since #noteref("boolean-functions", <thm-orthonormal>)[the parity functions are orthonormal], $hat(g)(sigma) = chevron.l chi_sigma, chi_sigma chevron.r = 1$ and $hat(g)(gamma) = chevron.l chi_sigma, chi_gamma chevron.r = 0$ for every $gamma != sigma$.

  Therefore, Fourier sampling outputs $sigma$ with probability $1$. A single query finds $sigma$ with certainty, whereas every classical algorithm needs $n$ queries. This is the _Bernstein-Vazirani algorithm_.

  We can check this by hand for $n = 2$ and $sigma = 11$, where $f(x) = x_1 xor x_2$. The state after the query is $1/2 (1, -1, -1, 1)$, and
  $
    1/2 mat(delim: "[", 1, 1, 1, 1; 1, -1, 1, -1; 1, 1, -1, -1; 1, -1, -1, 1) dot 1/2 mat(delim: "[", 1; -1; -1; 1) = 1/4 mat(delim: "[", 0; 0; 0; 4) = mat(delim: "[", 0; 0; 0; 1) = ket(11).
  $
  All of the amplitude ends up on $ket(11)$. For the other three bitstrings, the contributions cancel, just as they did when we unflipped a coin.
] <ex-quantum-parity>

The difference between the two examples is where the Fourier coefficients are. Fourier sampling is useful when the coefficients of $g$ are guaranteed to be concentrated on a few bitstrings, and those bitstrings answer our question.

Here is a small interactive widget that runs Fourier sampling on any function of two bits.

#widget("fourier-sampling")[
  The interactive Fourier sampling needs JavaScript.
]

Sometimes we do not even need to know where all of the coefficients are. A single coefficient can be enough.

#example(title: "Telling Constant from Balanced with One Query")[
  Suppose we are promised that $f$ is either _constant_, meaning $f(x)$ is the same for every $x$, or _balanced_, meaning $f(x) = 0$ for exactly half of the inputs $x$. We would like to find out which one it is. This is known as the _Deutsch-Jozsa problem_.

  Classically, an algorithm that is always correct needs $2^(n-1) + 1$ queries in the worst case. Until then, all of the answers it has seen may be equal, and $f$ could still be either constant or balanced.

  Let's look at the coefficient $hat(g)(0)$, where $0 in FF_2^n$ is the all-zeros bitstring. Since $chi_0 (x) = 1$ for every $x$, #noteref("boolean-functions", <prop-coefficient-formula>)[the formula for the Fourier coefficients] gives
  $
    hat(g)(0) = 1/2^n sum_(x in FF_2^n) g(x),
  $
  which is the average of $g$.

  If $f$ is constant, then $g$ is always $1$ or always $-1$, so $hat(g)(0) = plus.minus 1$, and Fourier sampling outputs the all-zeros bitstring with probability $1$.

  If $f$ is balanced, then $g$ is $1$ on half of the inputs and $-1$ on the other half, so $hat(g)(0) = 0$, and Fourier sampling never outputs the all-zeros bitstring.

  Therefore, we run Fourier sampling once and answer "constant" if the output is the all-zeros bitstring and "balanced" otherwise. A single query answers the question with certainty. This is the _Deutsch-Jozsa algorithm_.

  It is important to note that unfortunately, this speedup is less dramatic than it looks. A classical algorithm that is allowed to error with a small probability only needs a few queries, because using $k >= 1$ queries will lower the error probability to $epsilon <= 2^(1-k)$.
] <ex-deutsch-jozsa>

= Conclusion

In this chapter, we saw how a quantum computer works with an unknown function $f$. In the query model, we only count the number of times $f$ is evaluated. A quantum computer queries $f$ using the sign oracle, which multiplies the amplitude of $ket(x)$ by $g(x) = (-1)^(f(x))$. One query on the uniform superposition loads every value of $g$ into the signs of the state, and applying the Hadamard gates turns those signs into the Fourier coefficients of $g$. Measuring then outputs $gamma$ with probability $hat(g)(gamma)^2$. We never get to read the values of $f$ or the coefficients themselves, since each run costs one query and gives one bitstring, but we saw how for some functions $f$, one query gives away a lot of information.

In the next chapter, we will use the sign oracle and the Hadamard gates again to build Grover's algorithm, which searches for an input $x$ with $f(x) = 1$.

#remark[
  The query model is from Lecture 5 of O'Donnell and Wright's _Quantum Computation_ lecture notes, and the sign oracle is from Section 2.3 of Lecture 4. The theorem that the Hadamard gates compute the Fourier coefficients is Claim 2.5 in Lecture 6, and the Fourier sampling procedure appears there in Section 2.4.1.
]

= Exercises

#exercise(title: "Asking Twice")[
  Intuitively, what happens if we make the same query twice in a row? Prove your answer.
] <exr-asking-twice>

#exercise(title: "Opposite Day")[
  Let $f : FF_2^n -> FF_2$, and let $f'(x) = f(x) xor 1$ be the function that gives the opposite answer on every input. How does Fourier sampling $f'$ differ from Fourier sampling $f$? Prove your answer.
] <exr-opposite-day>

#exercise(title: "Always Zero")[
  Let's analyze the converse of a claim in the proof of the Deutsch-Jozsa algorithm.

  Suppose Fourier sampling $f$ outputs the all-zeros bitstring with probability $1$. Determine, with proof, all possible functions $f : FF_2^n -> FF_2$.
] <exr-always-zero>
