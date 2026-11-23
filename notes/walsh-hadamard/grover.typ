#import "/lib/notes.typ": *
#show: note.with(
  title: "Grover's algorithm",
  summary: "Working towards Grover's algorithm using Fourier sampling and proving its error bound using probability theory and trigonometry.",
)

#let ket(x) = $lr(| #x chevron.r)$
#let Hn = $H^(times.o n)$
#let Opm = $O_f^plus.minus$

In the previous chapter, we discussed the technique of Fourier sampling, and how it is only effective when the Fourier coefficients are concentrated.

In this chapter, we will discuss a very straightforward problem: finding an element satisfying a desired property in an unstructured list of $N$ elements. Using a classical computer, we intuitively would need to brute-force search through every element in the list to find one in the worst case. We will show that using Grover's algorithm, we can solve this problem using $O(sqrt(N))$ queries.

The plan is as follows. We first define the problem and show that a classical algorithm needs about $N$ queries. We then see why Fourier sampling alone cannot solve the problem. Next, we introduce one new gate, the diffusion gate, which is built from the Hadamard gates and fixes exactly what goes wrong. Grover's algorithm repeats one query and one diffusion gate. Finally, we analyze the number of repetitions needed to achieve a good error bound.

= The Search Problem

The problem of interest is searching for a desired element from an unstructured list. We name the $N = 2^n$ elements of the list by the bitstrings in $FF_2^n$, so that the list becomes a function $f : FF_2^n -> FF_2$. We can define the problem formally as follows.

#definition(title: "Unstructured Search")[
  Let $f : FF_2^n -> FF_2$ be an unknown function in the query model, and let $N = 2^n$. An input $x$ is called _marked_ if $f(x) = 1$. Let $M = {x in FF_2^n : f(x) = 1}$ be the set of marked inputs and let $k = abs(M)$. The _unstructured search problem_ asks for a marked input.
] <def-unstructured-search>

Intuitively, the function $f$ is what determines if a given input $x$ has the desired property. Very often in the real world, $f$ can be very expensive, so as complexity theorists, our goal is to minimize the number of times we have to query $f$.

#proposition(title: "Classical Search Needs About N Queries")[
  Let $x^*$ be a uniformly random element of $FF_2^n$, and let $f$ be the function whose only marked input is $x^*$. Every classical algorithm that makes at most $q$ queries outputs $x^*$ with probability at most $(q + 1) / N$.
] <prop-classical-search>

#proof[
  Let $cal(A)$ be a deterministic algorithm using $q$ queries. We will first run $cal(A)$ while answering $0$ to all $q$ queries. Since $cal(A)$ is deterministic, this tells us that while seeing $0$s as query results, the algorithm $cal(A)$ will query inputs $x_1, ..., x_q$, and outputs $y$ in the end. Note that $x_1, ..., x_q$ and $y$ do not depend on $x^*$.

  If $x^* in.not {x_1, ..., x_q}$, then every answer is in fact $0$ (our artificial query responses are correct), so $cal(A)$ actually outputs $y$. If $x^* in {x_1, ..., x_q}$, $cal(A)$ can and should output the correct answer. Therefore, $cal(A)$ outputs the correct answer only if $x^* in {x_1, ..., x_q, y}$, which means the probability that $cal(A)$ is correct is at most $(q+1)/N$, since $x^*$ is uniformly random and this set has at most $q + 1$ elements.

  Finally, a randomized algorithm is a deterministic algorithm chosen at random. The bound holds for every choice, so it also holds for any classical randomized algorithm. $square$
]

A direct corollary is that to find $x^*$ with probability at least $1/2$, any classical algorithm, deterministic or randomized, needs at least $N/2 - 1$ queries. On the other hand, $N$ queries are always enough. Our hope is to be able to do better using quantum algorithms.

= Fourier Sampling Is Not Enough

We would hope that we can apply the same trick, Fourier sampling, as from the last chapter to solve the problem using a few queries. Unfortunately, Fourier sampling fails here. Surprisingly, the reason is not that the Fourier coefficients are spread out. When few inputs are marked, they are concentrated, but on a bitstring that gives us no information.

#proposition(title: "Fourier Coefficients of a Search Function")[
  Let $f : FF_2^n -> FF_2$ have the marked set $M$ with $abs(M) = k$, and let $g(x) = (-1)^(f(x))$. Then,
  $
    hat(g)(0) = 1 - (2 k) / N, quad "and" quad hat(g)(gamma) = -2/N sum_(x in M) chi_gamma (x) quad "for all" gamma != 0.
  $
] <prop-search-coefficients>

#proof[
  Let $1_M$ be the indicator function for $M$. Then, $g=1 <==> 1_M = 0$ and $g=-1 <==> 1_M = 1$, so $g = 1 - 2 dot 1_M$. Note that $hat(1)(gamma) = 1$ when $gamma = 0$ and $hat(1) (gamma) = 0$ for all $gamma != 0$, since the constant function $1$ is the parity function $chi_0$ and #noteref("boolean-functions", <thm-orthonormal>)[the parity functions are orthonormal].

  Also, by #noteref("boolean-functions", <exr-linear>)[the linearity of Fourier coefficients], $ hat(g)(gamma) = hat(1)(gamma) - 2 dot hat(1_M) (gamma). $ This implies that $hat(g)(0) = 1 - 2 dot hat(1_M)(0)$ and $hat(g)(gamma) = 0 - 2 dot hat(1_M)(gamma)$ for all $gamma != 0$.

  By #noteref("boolean-functions", <prop-coefficient-formula>)[the formula for the Fourier coefficients], $ hat(1_M) (gamma) = 1/N sum_(x in M) chi_gamma (x). $

  Note that $chi_gamma (x) = 1$ when $gamma = 0$, so $hat(1_M)(0) = k/N$, so the claim is proven. $square$
]

#example(title: "Fourier Sampling with One Marked Input")[
  Let's consider the extreme case again, where $M = {x^*}$ for some $x^* in FF_2^n$, so $k=1$. Suppose we run Fourier sampling on $g(x) = (-1)^(f(x))$. The above proposition shows that Fourier sampling outputs $0$ with probability $(1-2/N)^2$ and each $gamma != 0$ with probability $4/N^2$. As $N -> oo$, the output of Fourier sampling is almost always $0$ for any $x^*$, and even when it is nonzero, all other possibilities share equal probabilities of being sampled independent of $x^*$, so we gain no useful information from Fourier sampling.
] <ex-one-marked-input>

Here is the Fourier sampling widget from the previous chapter, set to a function with one marked input.

#widget("fourier-sampling", qubits: 3, preset: "one-marked")[
  The interactive Fourier sampling needs JavaScript.
]

Why does Fourier sampling fail in this example? Recall from the previous chapter that Fourier sampling is useful when the coefficients are concentrated on bitstrings that answer our question. Here, with one marked input and $N$ large, almost all of the probability is on the all-zeros bitstring, because $g$ is almost the constant function $1$. Unfortunately, $hat(g)(0) = 1 - 2\/N$ does not depend on which input is marked and grows closer to $1$ as $N$ becomes large. Relying solely on the magnitudes of the probabilities is therefore hopeless.

However, it seems like the marked input only shows up in the signs of the other coefficients, but their magnitudes are tiny.

This suggests a new idea. Since the coefficient at $0$ is the problem, let's keep it as it is and do something to all of the other coefficients instead.

= The Diffusion Gate

How do we change the Fourier coefficients of a state? Recall from the chapter on qubits that applying $Hn$ replaces the amplitudes of a state by its Fourier coefficients (up to a factor), and applying $Hn$ again brings the amplitudes back. Therefore, if we apply $Hn$, change some signs, and apply $Hn$ again, we have changed the signs of the Fourier coefficients. The simplest thing to try is to flip the sign of every coefficient except the one at $0$.

#definition(title: "Diffusion Gate")[
  Let $Z_0$ be the $N times N$ diagonal matrix with $Z_0 ket(0) = ket(0)$ and $Z_0 ket(gamma) = -ket(gamma)$ for every $gamma != 0$. The _diffusion gate_ is
  $
    D = Hn Z_0 Hn.
  $
] <def-diffusion-gate>

Notice that $Z_0$ does not depend on $f$ at all, so applying $D$ does not cost a query. As usual (once again, let's be a bit careful here...), we have been calling $D$ a "gate" without proving it, so let's check that it actually is one.

#proposition(title: "The Diffusion Gate is a Gate")[
  $Z_0$ and $D$ are gates, and $D D = I$.
] <prop-diffusion-is-a-gate>

#proof[
  Note that $Z_0$ is the sign oracle $O_z^plus.minus$ of the function $z$ defined by $z(0) = 0$ and $z(gamma) = 1$ for all $gamma != 0$, and we know that #noteref("oracles", <prop-sign-oracle-is-a-gate>)[sign oracles are gates]. $D$ is then a product of three gates, so $D$ is also a gate by #noteref("qubits", <exr-composing-gates>)[the exercise on composing gates]. It is also not difficult to see that $D$ is a real matrix, because both $Hn$ and $Z_0$ are real matrices.

  Finally, $Z_0 Z_0 = I$ since every diagonal entry of $Z_0$ is $plus.minus 1$, and $Hn Hn = I$ by #noteref("qubits", <prop-hadamard-gates>)[the properties of the Hadamard gates], so
  $
    D D = Hn Z_0 Hn Hn Z_0 Hn = Hn Z_0 Z_0 Hn = Hn Hn = I. #h(1em) square
  $
]

By construction, $D$ should flip the sign of every Fourier coefficient except one. Let's state this precisely.

#theorem(title: "Diffusion Flips Every Fourier Coefficient but One")[
  Let $ket(psi) = sum_(x in FF_2^n) alpha(x) ket(x)$ be a state with real amplitudes, and let $beta(x)$ be the amplitude of $ket(x)$ in $D ket(psi)$. Then, $beta$ is real,
  $
    hat(beta)(0) = hat(alpha)(0), quad "and" quad hat(beta)(gamma) = -hat(alpha)(gamma) quad "for all" gamma != 0.
  $
] <thm-diffusion-fourier>

#proof[
  Since $D$ is a gate with real entries, $D ket(psi)$ is a state with real amplitudes, so $beta$ is real.

  Recall from the chapter on qubits that #noteref("qubits", <prop-hadamard-gates>)[the Hadamard gates replace real amplitudes by their Fourier coefficients]: the amplitude of $ket(gamma)$ in $Hn ket(psi)$ is $sqrt(N) hat(alpha)(gamma)$, and similarly the amplitude of $ket(gamma)$ in $Hn D ket(psi)$ is $sqrt(N) hat(beta)(gamma)$.

  On the other hand, since $Hn Hn = I$,
  $
    Hn D ket(psi) = Hn Hn Z_0 Hn ket(psi) = Z_0 Hn ket(psi).
  $
  By the definition of $Z_0$, the amplitude of $ket(gamma)$ in $Z_0 Hn ket(psi)$ is $sqrt(N) hat(alpha)(0)$ when $gamma = 0$ and $-sqrt(N) hat(alpha)(gamma)$ when $gamma != 0$. Comparing this with $sqrt(N) hat(beta)(gamma)$ proves the claim. $square$
]

Here is a small interactive widget that shows the amplitudes of a state above their Fourier coefficients, and what $D$ does to both.

#widget("diffusion-fourier")[
  The interactive diffusion gate needs JavaScript.
]

@thm-diffusion-fourier is a statement about Fourier coefficients. What does $D$ do to the amplitudes themselves? Surprisingly, the answer is very simple.

#proposition(title: "Inversion About the Mean")[
  With the notation of @thm-diffusion-fourier, let $mu = EE_(x ~ FF_2^n)[alpha(x)]$ be the mean amplitude. Then, for every $x in FF_2^n$,
  $
    beta(x) = 2 mu - alpha(x).
  $
] <prop-inversion-about-the-mean>

#proof[
  Since $chi_0 (x) = 1$ for every $x$, #noteref("boolean-functions", <prop-coefficient-formula>)[the formula for the Fourier coefficients] gives $hat(alpha)(0) = mu$. By #noteref("boolean-functions", <thm-fourier-expansion>)[the Fourier expansion] of $beta$, then @thm-diffusion-fourier, then the Fourier expansion of $alpha$,
  $
    beta(x) & = sum_(gamma in FF_2^n) hat(beta)(gamma) chi_gamma (x)                    &           "(Fourier expansion)" \
            & = hat(alpha)(0) - sum_(gamma != 0) hat(alpha)(gamma) chi_gamma (x)        &         "(the theorem above)" \
            & = 2 hat(alpha)(0) - sum_(gamma in FF_2^n) hat(alpha)(gamma) chi_gamma (x) \
            & = 2 mu - alpha(x). #h(1em) square
  $
]

In words, the diffusion gate reflects every amplitude across the average. Since $2 mu - alpha(x) = mu + (mu - alpha(x))$, an amplitude that was below the average by some amount ends up above the average by the same amount.

Now we can see why this helps. Suppose there is only one marked input. After one query on the uniform superposition, every unmarked input has amplitude $1\/sqrt(N)$ and the marked input has amplitude $-1\/sqrt(N)$. The average is still almost $1\/sqrt(N)$, since only one of the $N$ amplitudes changed. Reflecting across the average barely moves the unmarked amplitudes, but it sends the marked amplitude from $-1\/sqrt(N)$ to almost $3\/sqrt(N)$. The sign that a measurement could not see has become a magnitude that it can see.

Note that this only works because amplitudes can be negative. Classical probabilities are never negative, so nothing could be pushed this far below the average.

= Grover's Algorithm

With one marked input and $N$ large, one query followed by one diffusion gate made the marked amplitude about three times as large. If we apply this process repeatedly (a kind of "boosting" idea), we arrive at Grover's algorithm.

#definition(title: "Grover's Algorithm")[
  Let $f : FF_2^n -> FF_2$ and let $T >= 0$ be an integer. _Grover's algorithm_ with $T$ iterations is the following procedure on $n$ qubits.

  + Start with the state $ket(0)$.
  + Apply $Hn$.
  + Repeat $T$ times: apply the sign oracle $Opm$, then apply the diffusion gate $D$.
  + Measure.
] <def-grovers-algorithm>

Here is the algorithm drawn as a circuit.

#widget("circuit", kind: "grover")[
  The circuit applies $Hn$, then repeats the sign oracle $Opm$ and the diffusion gate $D$ for $T$ times, and measures every qubit.
]

#example(title: "Finding the Marked Input of AND with One Query")[
  Let $n = 2$ and $f(x) = x_1 x_2$, whose only marked input is $11$. Recall that #noteref("oracles", <ex-sampling-and>)[Fourier sampling $f$] gave a uniformly random bitstring. Let's run Grover's algorithm with $T = 1$ instead.

  After applying $H^(times.o 2)$ and the query, the state is $1/2 (1, 1, 1, -1)$ as a column vector. Its average amplitude is $mu = 1/4$, so by @prop-inversion-about-the-mean, the diffusion gate replaces each amplitude $alpha(x)$ by $1/2 - alpha(x)$:
  $
    1/2 (1, 1, 1, -1) arrow.r.long (0, 0, 0, 1) = ket(11).
  $
  Measuring outputs the marked input $11$ with probability $1$, using only one query. Classically, by @prop-classical-search, one query finds an unknown marked input among four with probability only at most $1/2$.
] <ex-grover-and>

Here is a small interactive widget that runs the algorithm one query and one diffusion gate at a time.

#widget("grover-mean")[
  The interactive amplitudes need JavaScript.
]

= How Many Iterations Do We Need?

How many times should we repeat the process of applying the sign oracle and then applying the diffusion gate? To find the right number of iterations, we need to mathematically determine the state after any iteration.

It turns out that since the algorithm treats all marked inputs in the same way and all unmarked inputs in the same way, only two numbers are enough to describe the whole state.

#lemma(title: "Two Amplitudes are Enough")[
  Suppose $1 <= k < N$. After $t$ iterations of Grover's algorithm, every marked input has the same amplitude $a_t$ and every unmarked input has the same amplitude $b_t$, where $a_0 = b_0 = 1/sqrt(N)$ and
  $
    a_(t+1) = (1 - (2 k) / N) a_t + (2 - (2k)/N) b_t, quad b_(t+1) = (-(2 k) / N) a_t + (1 - (2 k) / N) b_t.
  $
] <lem-two-amplitudes>

#proof[
  We use induction on $t$. For $t = 0$, the state is #noteref("qubits", <prop-hadamard-gates>)[the uniform superposition] $Hn ket(0)$, where every amplitude is $1/sqrt(N)$.

  Suppose the claim holds for $t$. The sign oracle negates the amplitudes of the marked inputs, so they become $-a_t$, while the unmarked ones stay as $b_t$. The average amplitude is now
  $
    mu = (-k a_t + (N - k) b_t) / N.
  $
  By @prop-inversion-about-the-mean, the diffusion gate sends every marked amplitude to $2 mu + a_t$ and every unmarked amplitude to $2 mu - b_t$. Therefore, all marked inputs still share one amplitude, and so do all unmarked inputs. In particular, we have
  $
    a_(t+1) = 2 mu + a_t = (1 - (2 k) / N) a_t + (2 - (2k)/N) b_t
  $
  and
  $
    b_(t+1) = 2 mu - b_t = (-(2 k) / N) a_t + (1 - (2 k) / N) b_t.
  $
  $square$
]

This recurrence looks really complicated, but it is hiding something simple. Recall that the squares of the amplitudes of a state sum to $1$, which here means $k a_t^2 + (N - k) b_t^2 = 1$. Therefore, the point $(sqrt(N - k) b_t, sqrt(k) a_t)$ lies on the unit circle, and we can describe it by a single angle. At the start, both amplitudes are $1\/sqrt(N)$, so the point is $(sqrt((N - k)\/N), sqrt(k\/N))$, whose angle $theta$ satisfies $sin theta = sqrt(k\/N)$. Amazingly, it turns out that each iteration rotates this point by the angle $2 theta$.

#lemma(title: "Each Iteration Rotates by the Same Angle")[
  Suppose $1 <= k < N$, and let $theta$ be the unique angle with $0 < theta < pi/2$ and $sin theta = sqrt(k / N)$. Then, for every $t >= 0$,
  $
    a_t = 1/sqrt(k) sin((2 t + 1) theta), quad b_t = 1/sqrt(N - k) cos((2 t + 1) theta).
  $
] <lem-rotation>

#proof[
  We use induction on $t$. Note that $cos theta = sqrt(1 - k\/N) = sqrt((N - k)\/N)$. For $t = 0$, we have $1/sqrt(k) sin theta = 1/sqrt(N) = a_0$ and $1/sqrt(N - k) cos theta = 1/sqrt(N) = b_0$.

  Suppose the claim holds for $t$, and let $phi = (2 t + 1) theta$. By the double-angle identities,
  $
    cos 2 theta = 1 - 2 sin^2 theta = 1 - (2 k) / N
  $
  and
  $
    sin 2 theta = 2 sin theta cos theta = (2 sqrt(k (N - k))) / N.
  $
  Substituting $a_t = 1/sqrt(k) sin phi$ and $b_t = 1/sqrt(N - k) cos phi$ into @lem-two-amplitudes and using the angle addition identities,
  $
    sqrt(k) a_(t+1) & = (1 - (2 k) / N) sin phi + (2 - (2k)/N) dot sqrt(k)/(sqrt(N-k)) cos phi \
                    & = (1 - (2 k) / N) sin phi + (2 sqrt(k (N - k))) / N cos phi \
                    & = cos 2 theta sin phi + sin 2 theta cos phi \
                    & = sin(phi + 2 theta),
  $
  $
    sqrt(N - k) b_(t+1) & = -(2 k) / N dot sqrt(N-k)/sqrt(k) sin phi + (1 - (2 k) / N) cos phi \
                        & = -(2 sqrt(k (N - k))) / N sin phi + (1 - (2 k) / N) cos phi \
                        & = - sin 2 theta sin phi + cos 2 theta cos phi \
                        & = cos(phi + 2 theta).
  $

  Since $phi + 2 theta = (2 (t + 1) + 1) theta$, the claim holds for $t + 1$. $square$
]

Here is a small interactive widget that draws the state as an arrow on a circle, turning by $2 theta$ with each iteration.

#widget("grover-rotation")[
  The interactive rotation needs JavaScript.
]

The probability of measuring a marked input is $k a_t^2 = sin^2 ((2 t + 1) theta)$, the square of the height of the point. We would like this probability to be as close to $1$ as possible.

Note that this quantity is close to $1$ when the angle $(2 t + 1) theta$ is close to $pi\/2$, and the first time this happens tells us when to stop. Solving $(2t+1)theta = pi/2$ gives $t= (pi/(2theta) - 1)\/2 = pi/(4 theta) - 1/2$, so we can conjecture that $T = floor(pi/(4 theta))$ iterations is a good place to stop.

#theorem(title: "Grover's Algorithm")[
  Suppose $1 <= k < N$, and let $theta$ be the angle with $0 < theta < pi/2$ and $sin theta = sqrt(k / N)$. Grover's algorithm with $t$ iterations makes $t$ queries and outputs a marked input with probability
  $
    sin^2 ((2 t + 1) theta).
  $
  In particular, with $T = floor(pi / (4 theta))$ iterations, it outputs a marked input with probability at least $1 - k/N$, and
  $
    T <= pi/4 sqrt(N / k).
  $
] <thm-grover>

#proof[
  Each iteration applies the sign oracle once, so $t$ iterations make $t$ queries. By the definition of #noteref("qubits", <def-measurement>)[measurement] and @lem-rotation, the probability of measuring one of the $k$ marked inputs is $k a_t^2 = (sqrt(k) a_t)^2 = sin^2 ((2 t + 1) theta)$.

  Now let $T = floor(pi / (4 theta))$, so that $pi / (4 theta) - 1 < T <= pi / (4 theta)$. Multiplying by $2 theta$ and adding $theta$ gives
  $
    pi / 2 - theta < (2 T + 1) theta <= pi / 2 + theta.
  $
  The angle $(2 T + 1) theta$ is within $theta$ of $pi\/2$ (recall that $0 < theta < pi\/2$), and $sin^2$ only decreases as we move away from $pi\/2$ by at most $pi\/2$, so
  $
    sin^2 ((2 T + 1) theta) >= sin^2 (pi / 2 - theta) = cos^2 theta = 1 - k / N.
  $
  Finally, $theta >= sin theta = sqrt(k\/N)$, so $T <= pi / (4 theta) <= pi/4 sqrt(N / k)$. $square$
]

#proposition(title: "One Marked Input")[
  If exactly one input is marked, Grover's algorithm finds it with probability at least $1 - 1/N$ using at most $pi/4 sqrt(N)$ queries.
] <prop-one-marked-input>

#proof[
  If $N = 1$, the only input is marked and no queries are needed. Otherwise, $1 <= k < N$ with $k = 1$, and @thm-grover with $T = floor(pi / (4 theta))$ iterations gives probability at least $1 - 1/N$ using $T <= pi/4 sqrt(N)$ queries. $square$
]

Recall that from @prop-classical-search we know a classical algorithm making $pi/4 sqrt(N)$ queries finds the marked input with probability at most about $1\/sqrt(N)$.

It is important to note that, unlike in classical search, more queries do not always help. If we keep iterating, the point rotates past the top of the circle, and the probability of success goes down again.

#example(title: "Too Many Iterations")[
  Let $N = 8$ and $k = 1$, so $theta = arcsin(1\/sqrt(8)) approx 0.361$ and $T = floor(pi \/ (4 theta)) = 2$. By @thm-grover, the probabilities of success $sin^2 ((2 t + 1) theta)$ for $t = 0, 1, 2, 3, 4$ are about
  $
    0.125, quad 0.781, quad 0.945, quad 0.330, quad 0.012.
  $
  At $t = 2$, the angle $5 theta approx 1.81$ is the closest to $pi\/2 approx 1.57$, and the probability is above the bound $1 - 1\/8 = 0.875$ from @prop-one-marked-input. Two more iterations rotate the point almost all the way to the other side of the circle, and the algorithm becomes worse than a random guess, which succeeds with probability $0.125$.
] <ex-too-many-iterations>

Here is a small interactive widget that plots the probability of success against the number of queries, next to the classical bound.

#widget("grover-success")[
  The interactive plot needs JavaScript.
]

= Conclusion

In this chapter, we searched an unstructured list of $N$ elements for a marked one. Classically, this takes about $N$ queries. Fourier sampling fails, because almost all of the probability is on the coefficient $hat(g)(0)$, which does not depend on which inputs are marked. The diffusion gate $D = Hn Z_0 Hn$ flips the sign of every Fourier coefficient of the amplitudes except the one at $0$, which reflects every amplitude across the average. One query followed by one diffusion gate rotates the state by the angle $2 theta$, where $sin theta = sqrt(k\/N)$, so about $pi/4 sqrt(N\/k)$ iterations bring the probability of measuring a marked input close to $1$.

Everything in the algorithm other than the queries is built from the Hadamard gates and one sign flip, and its analysis only needed the Fourier coefficients from the chapter on Boolean functions. The Walsh-Hadamard transform has carried us all the way from Boolean functions to a quantum algorithm that solves a very simple problem faster than every classical one.

#remark[
  This chapter follows Lecture 4 of O'Donnell and Wright's _Quantum Computation_ lecture notes. The search problem is Definition 2.1 there, the algorithm and inversion about the mean are from Section 2.4, and the construction $D = Hn Z_0 Hn$ is from Section 2.6. The lecture defines the diffusion gate as inversion about the mean and only proves a constant probability of success in Section 2.5. The view of the diffusion gate through Fourier coefficients, keeping the coefficient at $0$ and negating the others, is from Section 2.4.2 of Lecture 6. The algorithm itself is due to Grover in _A Fast Quantum Mechanical Algorithm for Database Search_ (1996), and the exact formula $sin^2 ((2 t + 1) theta)$ is due to Boyer, Brassard, Høyer and Tapp in _Tight Bounds on Quantum Searching_ (1998).

  We omitted two things. First, choosing $T$ requires knowing the number $k$ of marked inputs. The same paper shows how to search efficiently without knowing $k$. Second, Grover's algorithm is optimal: every quantum algorithm for unstructured search needs $Omega(sqrt(N))$ queries. This is due to Bennett, Bernstein, Brassard and Vazirani in _Strengths and Weaknesses of Quantum Computing_ (1997), and Beals, Buhrman, Cleve, Mosca and de Wolf later proved it using polynomials in _Quantum Lower Bounds by Polynomials_ (2001).
]

= Exercises

#exercise(title: "Grover's with Certainty")[
  Note that Grover's algorithm doesn't always determine an answer with certainty, but it does so in some special cases.

  Show that there exists a constant ratio $r$, such that if $k/N = r$, then Grover's algorithm can complete the search with certainty after just one iteration.
] <exr-search-with-certainty>

#exercise(title: "Arbitrarily Low Constant Error")[
  Let $epsilon$ be a constant such that $0 < epsilon < 1/2$. Show that there exists a quantum algorithm with query complexity $O(sqrt(N))$ that solves the unstructured search problem with error probability at most $epsilon$.
] <exr-low-constant-error>

#exercise(title: "Bonus: Can We Reduce the Error?")[
  Does there exist a quantum algorithm with query complexity $o(N)$ that solves the unstructured search problem with error probability at most $2^(-N)$?
] <exr-reduce-the-error>
