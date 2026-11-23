#import "/lib/notes.typ": *
#show: note.with(
  title: "Overview and prerequisites",
  summary: "The start of a journey to Grover's algorithm by way of the Walsh-Hadamard matrices.",
)

= What These Notes Are About

Suppose you want to understand the properties of a hidden "black-box" function $f$, and all you can do is to query $f$ on some input values. Can you confidently describe $f$ without querying it on every possible input? Suppose you want to search for an element in an unordered list. Can you do this without enumerating every index in the list?

These kinds of questions in complexity theory surrounding Boolean functions are particularly fascinating. However, the following notes are not an ordinary or standard analysis of these kinds of well-known problems.

Instead, we will first explore many topics surrounding a special type of transform called the Walsh-Hadamard transform. It turns out that the Walsh-Hadamard transform is an extremely powerful tool that allows us to efficiently make conversions between a function and its Fourier coefficients. Not only does it allow us to solve problems much faster on classical computers, it also has many surprising appearances in quantum algorithms.

Let's embark on a journey where, before tackling difficult complexity theory problems about Boolean functions, we first befriend the Walsh-Hadamard transform and use it as our main weapon against any obstacles we face along the way.

= Prerequisites

In the following chapters, we will assume you have a good level of mathematical maturity. We will be using multi-dimensional linear algebra and basic probability theory extensively, so you are expected to remember the foundational definitions and theorems on these topics. In particular, you should be familiar with the concept of abstract vector spaces and be open to exploring inner product spaces that feel very different from $RR^n$. You should remember the properties of probabilities and expected values. Finally, on the mathematics side, we will also use trigonometry to prove the complexity of Grover's algorithm, so you should be familiar with various trigonometric identities.

Since the chapters often discuss topics in time complexity and query complexity, you are expected to understand the basics of complexity theory (at least be able to reason about the time complexity of algorithms and solve work recurrence relations).

You do *not* need any prior knowledge about Fourier transforms or quantum computation. We will walk through the minimal set of definitions and propositions we need in these topics to prove all the claims we want to prove.

Furthermore, because I (the author) enjoy viewing computer science problems through abstract composition of algorithms as well as competitive programming, some of the material and applications will be geared towards an audience who enjoys "problem-solving" examples rather than applications of the algorithms in real life (unfortunately, at the time of writing, I have not directly worked with signals or real quantum computers). Therefore, some examples might feel "contrived" or "competitive programming style," so you may want to be ready for these kinds of examples.

= Roadmap

Here is a map of the sections, where an arrow means that a section is needed for the one it points to.

#widget("roadmap")[
  Sections 2.1 and 2.2 lead through 3.1 and 3.2 to Grover's algorithm in 4.1, and section 2.3 branches off after 2.2.
]

We will begin with some introductory definitions and explorations of Boolean functions. This allows us to introduce the concept of Fourier coefficients, which is a key object for all of our applications to follow. Then, we will investigate some interesting and surprising properties of the Walsh-Hadamard matrices, and then relate these matrices to Fourier coefficients of Boolean functions through the Walsh-Hadamard transform.

After we have a good understanding of the Walsh-Hadamard matrices, we will then come up with a classical algorithm to compute any Walsh-Hadamard transform efficiently. Using the fast Walsh-Hadamard transform, we will discuss some applications of the algorithm to some problems about Boolean functions that, at first glance, seem impossible to do faster than brute force.

After exploring the classical results, we will begin our exploration in the quantum world by first introducing qubits and the query complexity model in quantum computation. Then, we will show that, using the Walsh-Hadamard transform, it is possible to solve some problems (that would usually require brute forcing using a classical computer) with very low query complexity using a quantum algorithm.

Finally, we will combine our understanding of Fourier analysis, the Walsh-Hadamard transform, and quantum algorithms, to face the final boss: Grover's algorithm. We will show that using a quantum algorithm, it is possible to search for an element in a list with far lower query complexity than any classical computer can hope to accomplish.
