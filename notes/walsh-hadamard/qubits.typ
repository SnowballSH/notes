#import "/lib/notes.typ": *
#show: note.with(
  title: "Qubits, measurement, and the Hadamard gate",
  summary: "The minimum of quantum computing we need: states as unit vectors, measurement, gates as unitary matrices, and the Hadamard gate as a Walsh-Hadamard matrix.",
  order: 4,
)

#let ket(x) = $lr(| #x chevron.r)$
#let Hn = $H^(times.o n)$

So far, everything we did could be run on an ordinary computer. In the rest of these notes, we will see that a quantum computer can apply the Walsh-Hadamard transform in a completely different way. This chapter introduces the small amount of quantum computing we need: what a quantum state is, what happens when we measure it, and what operations we are allowed to perform on it. We only need linear algebra, and no physics.

= Qubits

A classical bit is either $0$ or $1$. A quantum bit is a combination of both.

#definition(title: "Qubit")[
  Let $ket(0) = mat(delim: "[", 1; 0)$ and $ket(1) = mat(delim: "[", 0; 1)$. The state of a _qubit_ is a vector
  $
    alpha ket(0) + beta ket(1) = mat(delim: "[", alpha; beta)
  $
  with $alpha, beta in CC$ and $abs(alpha)^2 + abs(beta)^2 = 1$. The numbers $alpha$ and $beta$ are called _amplitudes_.
] <def-qubit>

In other words, the state of a qubit is a unit vector in $CC^2$. The notation $ket(dot)$ is called a _ket_, and it is simply the way quantum computing writes column vectors.

Amplitudes are complex numbers in general, but every amplitude that appears in these notes is real. You can safely read $CC$ as $RR$ and $abs(alpha)^2$ as $alpha^2$ throughout.

With $n$ qubits, there are $2^n$ classical bitstrings, and the state is a combination of all of them.

#definition(title: "State of Several Qubits")[
  For $x in FF_2^n$, let $ket(x)$ be the standard basis vector of $CC^(2^n)$ with a $1$ at index $x$ and $0$ everywhere else. The state of $n$ qubits is a vector
  $
    ket(psi) = sum_(x in FF_2^n) alpha_x ket(x)
  $
  with $alpha_x in CC$ and $sum_(x in FF_2^n) abs(alpha_x)^2 = 1$. The vectors $ket(x)$ are called the _basis states_.
] <def-state>

This should look familiar. A state of $n$ qubits is a column vector indexed by $FF_2^n$, exactly like the vectors of values of functions on $FF_2^n$ in the previous chapters. The only new requirement is that the squares of the entries sum to $1$.

= Measurement

We cannot look at the amplitudes of a state directly. The only way to get information out of a quantum state is to _measure_ it.

#definition(title: "Measurement")[
  Measuring the state $ket(psi) = sum_(x in FF_2^n) alpha_x ket(x)$ outputs the bitstring $x$ with probability $abs(alpha_x)^2$. After the measurement, the state is $ket(x)$.
] <def-measurement>

The requirement that the squares of the amplitudes sum to $1$ is exactly what makes these probabilities sum to $1$. Notice that measuring destroys the state: we get a single bitstring, and all of the other amplitudes are gone.

#example(title: "Two Fair Coins")[
  Consider the two states
  $
    ket(+) = 1/sqrt(2) ket(0) + 1/sqrt(2) ket(1), quad ket(-) = 1/sqrt(2) ket(0) - 1/sqrt(2) ket(1).
  $
  Measuring either one outputs $0$ with probability $1/2$ and $1$ with probability $1/2$, since $(1/sqrt(2))^2 = (-1/sqrt(2))^2 = 1/2$. A measurement cannot tell these two states apart, even though they are different vectors.
] <ex-fair-coins>

= Gates

Before measuring, we are allowed to change the state. The operations we may perform are called _gates_.

#definition(title: "Gate")[
  A _gate_ on $n$ qubits is a $2^n times 2^n$ unitary matrix $U$, that is, a matrix with $U^dagger U = I$, where $U^dagger$ is the conjugate transpose of $U$. Applying the gate to the state $ket(psi)$ produces the state $U ket(psi)$.
] <def-gate>

For a real matrix, $U^dagger = U^"T"$, so a real matrix is unitary exactly when $U^"T" U = I$. We should check that the result of applying a gate is still a valid state.

#proposition(title: "Gates Send States to States")[
  If $U$ is unitary and $ket(psi)$ is a state, then $U ket(psi)$ is a state.
] <prop-gates-preserve-states>

#proof[
  Write $v = ket(psi)$. The sum of the squared absolute values of the entries of a vector $w$ is $w^dagger w$, so we need to show that $(U v)^dagger (U v) = 1$. Indeed,
  $
    (U v)^dagger (U v) = v^dagger U^dagger U v = v^dagger v = 1. quad square
  $
]

A gate is a matrix, so it is linear. To know what a gate does to every state, it is enough to know what it does to the basis states: $U ket(x)$ is column $x$ of $U$.

= The Hadamard Gate

The most important gate in these notes is one we have already met.

#definition(title: "Hadamard Gate")[
  The _Hadamard gate_ is the gate on one qubit given by
  $
    H = 1/sqrt(2) mat(delim: "[", 1, 1; 1, -1) = 1/sqrt(2) H_2.
  $
] <def-hadamard-gate>

Reading off the columns, $H ket(0) = ket(+)$ and $H ket(1) = ket(-)$, the two states of @ex-fair-coins. So the Hadamard gate turns a definite bit into a fair coin. Surprisingly, it also turns the fair coin back into a definite bit.

#example(title: "Unflipping a Coin")[
  Start with $ket(0)$ and apply $H$ to get $ket(+)$. Applying $H$ again gives
  $
    H ket(+) = 1/sqrt(2) H ket(0) + 1/sqrt(2) H ket(1) = 1/2 (ket(0) + ket(1)) + 1/2 (ket(0) - ket(1)) = ket(0).
  $
  Measuring now outputs $0$ with certainty. The two contributions to the amplitude of $ket(1)$ have opposite signs and cancel. This cancellation is called _interference_, and it is something that ordinary probabilities, which are never negative, cannot do.
] <ex-unflipping>

To apply the Hadamard gate to every one of $n$ qubits at once, we need to know how to combine gates on separate qubits into one large matrix.

#definition(title: "Tensor Product")[
  Let $A = mat(delim: "[", a, b; c, d)$ be a gate on one qubit and let $B$ be a gate on $n$ qubits. The _tensor product_ of $A$ and $B$ is the $2^(n+1) times 2^(n+1)$ matrix
  $
    A times.o B = mat(delim: "[", a B, b B; c B, d B).
  $
  It is the gate on $n + 1$ qubits that applies $A$ to one qubit and $B$ to the other $n$ qubits.
] <def-tensor-product>

We write $Hn$ for the gate that applies $H$ to each of $n$ qubits. That is, $H^(times.o 1) = H$ and $H^(times.o (n+1)) = H times.o Hn$. Expanding the definition of the tensor product,
$
  H^(times.o (n+1)) = 1/sqrt(2) mat(delim: "[", Hn, Hn; Hn, -Hn).
$
Up to the factor of $1/sqrt(2)$, this is precisely the recursive definition of the Walsh-Hadamard matrices!

#theorem(title: "Hadamard Gates are the Walsh-Hadamard Matrices")[
  For all $n >= 1$,
  $
    Hn = 1/sqrt(2^n) H_(2^n).
  $
] <thm-hadamard-gates>

#proof[
  We proceed by induction on $n$. The base case $n = 1$ is @def-hadamard-gate. For the inductive case, let $n >= 1$. Then,
  $
    H^(times.o (n+1)) & = 1/sqrt(2) mat(delim: "[", Hn, Hn; Hn, -Hn) \
    & = 1/sqrt(2) dot 1/sqrt(2^n) mat(delim: "[", H_(2^n), H_(2^n); H_(2^n), -H_(2^n)) \
    & = 1/sqrt(2^(n+1)) H_(2^(n+1)). quad square
  $
]

Everything we proved about the Walsh-Hadamard matrices now tells us something about $Hn$.

#proposition(title: "Properties of the Hadamard Gates")[
  For all $n >= 1$:

  + $Hn$ is unitary, so it really is a gate.
  + $Hn Hn = I$. That is, $Hn$ is its own inverse.
  + For every $x in FF_2^n$,
    $
      Hn ket(x) = 1/sqrt(2^n) sum_(gamma in FF_2^n) (-1)^(gamma dot x) ket(gamma).
    $
] <prop-hadamard-gates>

#proof[
  Recall that $H_(2^n)$ is symmetric (#noteref("walsh-hadamard", <exr-symmetric>)[an exercise in the second chapter]) and that $H_(2^n) H_(2^n)^"T" = 2^n I$, since #noteref("walsh-hadamard", <prop-walsh-hadamard-is-hadamard>)[the Walsh-Hadamard matrices are Hadamard matrices] and by #noteref("walsh-hadamard", <hadamard-criterion>)[the criterion for Hadamard matrices]. By @thm-hadamard-gates, $Hn$ is real and symmetric, and
  $
    Hn Hn = 1/2^n H_(2^n) H_(2^n) = 1/2^n H_(2^n) H_(2^n)^"T" = I.
  $
  This is the second claim. Since $(Hn)^dagger = (Hn)^"T" = Hn$, it is also the first.

  For the third claim, $Hn ket(x)$ is column $x$ of $1/sqrt(2^n) H_(2^n)$. By #noteref("walsh-hadamard", <prop-entries>)[the formula for the entries of the Walsh-Hadamard matrices], the entry of this column at index $gamma$ is $1/sqrt(2^n) (-1)^(gamma dot x)$. $square$
]

Two consequences of the third property will be used again and again.

First, take $x = 0$. Every sign is $+1$, so
$
  Hn ket(0) = 1/sqrt(2^n) sum_(gamma in FF_2^n) ket(gamma).
$
This state is called the _uniform superposition_: measuring it outputs each of the $2^n$ bitstrings with the same probability $1/2^n$. Notice how little work this takes. We applied one small gate to each of $n$ qubits, and the result has $2^n$ nonzero amplitudes.

Second, the signs $(-1)^(gamma dot x)$ are the values of the parity functions $chi_gamma (x)$. Let $ket(psi) = sum_(x in FF_2^n) alpha_x ket(x)$ be a state with real amplitudes, and view $alpha$ as a function $FF_2^n -> RR$. By #noteref("walsh-hadamard", <thm-wht>)[the Walsh-Hadamard transform theorem], $hat(alpha) = 1/2^n H_(2^n) alpha$, so
$
  Hn ket(psi) = 1/sqrt(2^n) H_(2^n) alpha = sqrt(2^n) hat(alpha).
$
In words, applying a Hadamard gate to every qubit replaces the amplitudes of a state by its Fourier coefficients, scaled by $sqrt(2^n)$. Classically, the fast Walsh-Hadamard transform needed $O(n 2^n)$ operations to do this. Here it takes $n$ gates. The catch is the measurement: we do not get to read the Fourier coefficients, only to sample one bitstring $gamma$ with probability $2^n hat(alpha)(gamma)^2$.

= Conclusion

In this chapter, we introduced the three ingredients of a quantum computation. A state of $n$ qubits is a unit vector indexed by $FF_2^n$. A gate is a unitary matrix applied to the state. A measurement outputs the bitstring $x$ with probability equal to the square of its amplitude. We then saw that applying the Hadamard gate to every qubit is the Walsh-Hadamard matrix $H_(2^n)$ scaled by $1/sqrt(2^n)$, so it transforms the amplitudes of a state into its Fourier coefficients, scaled by $sqrt(2^n)$.

In the next chapter, we will see how to load a function into the amplitudes of a state, so that this transform tells us something about the function.

#remark[
  This chapter follows Lectures 1 and 2 of O'Donnell and Wright's _Quantum Computation_ lecture notes, which cover states, measurement and gates in much more depth. The relationship between the Hadamard gates and the Fourier coefficients is from Section 2.3 of Lecture 6.
]

= Exercises

#exercise(title: "Measuring After Hadamard Gates")[
  Let $n = 2$ and $x = (0, 1)$. Write $H^(times.o 2) ket(x)$ as a combination of the four basis states $ket(gamma)$, and find the probability of each outcome when it is measured.
] <exr-measuring>

#exercise(title: "Composing Gates")[
  Show that if $U$ and $V$ are unitary matrices of the same size, then $U V$ is unitary. This means that applying one gate after another is again a gate.
] <exr-composing-gates>

#exercise(title: "Back to All Zeros")[
  Let $ket(psi)$ be the uniform superposition on $n$ qubits. Without any computation, explain why $Hn ket(psi) = ket(0)$. Then verify it directly using #noteref("walsh-hadamard", <exr-balanced-rows>)[the exercise on balanced rows].
] <exr-back-to-zeros>
