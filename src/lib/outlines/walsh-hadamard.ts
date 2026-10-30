import type { NotesOutline } from "./types";

export const walshHadamard: NotesOutline = {
	title: "The Walsh–Hadamard Transform",
	description:
		"From Fourier analysis of Boolean functions to quantum query algorithms, Simon’s algorithm and Grover search.",
	chapters: [
		{
			title: "Mathematical Foundations",
			sections: [
				{
					title: "Binary vector spaces and arithmetic over 𝔽₂",
					summary:
						"Sets up bit strings as vectors over the two-element field. Covers XOR as addition, the dot product mod 2, and subspaces.",
				},
				{
					title: "Boolean functions and parity functions",
					summary:
						"Introduces Boolean functions in both the {0,1} and ±1 conventions. Parity functions appear as the basic building blocks of everything that follows.",
				},
				{
					title: "Inner products and orthogonal bases",
					summary:
						"Treats real-valued functions on the hypercube as a vector space with an averaging inner product. Reviews what an orthonormal basis gives us.",
				},
				{
					title: "Fourier analysis on finite abelian groups",
					summary:
						"Defines characters of a finite abelian group and shows that they form an orthogonal basis. The hypercube then becomes the special case these notes study.",
				},
			],
		},
		{
			title: "The Walsh–Hadamard Transform",
			sections: [
				{
					title: "Hadamard matrices and their recursive construction",
					summary:
						"Defines Hadamard matrices and builds the standard family by repeated tensor products. The recursion here is what later powers the fast transform.",
				},
				{
					title: "Walsh characters and the Fourier basis",
					summary:
						"Identifies the rows of the Hadamard matrix with parity characters. This connects the matrix view to the Fourier view of Chapter 1.",
				},
				{
					title: "Transform conventions and normalization",
					summary:
						"Compares the common scalings and the {0,1} and ±1 conventions. Fixes the convention used for the rest of the notes.",
				},
				{
					title: "Orthogonality, inversion, and Parseval’s identity",
					summary:
						"Proves the core identities of the transform. These give the inverse formula and the conservation of total weight across Fourier coefficients.",
				},
				{
					title: "The fast Walsh–Hadamard transform",
					summary:
						"Derives the butterfly algorithm from the recursive construction. Includes the running time and an in-place implementation.",
				},
				{
					title: "Examples: constants, parities, and Boolean functions",
					summary:
						"Works out spectra of small examples by hand. Builds intuition for what the coefficients of familiar functions look like.",
				},
			],
		},
		{
			title: "Classical Applications",
			sections: [
				{
					title: "Correlation analysis of Boolean functions",
					summary:
						"Reads Fourier coefficients as correlations with parities. Shows how to find the linear functions closest to a given function.",
				},
				{
					title: "XOR convolution",
					summary:
						"Defines convolution over XOR and shows that the transform diagonalizes it. Gives the standard fast algorithm used in competitive programming and elsewhere.",
				},
				{
					title: "Linearity testing",
					summary:
						"Presents the Blum–Luby–Rubinfeld test. Uses Fourier analysis to prove that passing the test implies closeness to a parity.",
				},
				{
					title: "Hadamard codes and decoding",
					summary:
						"Builds the Hadamard code from parity evaluations and studies its distance. Decoding is treated through the transform and through local correction.",
				},
				{
					title: "Boolean function learning",
					summary:
						"Shows how to estimate Fourier coefficients from samples. Introduces learning functions with concentrated spectra, which sets up the quantum learning material later.",
				},
			],
		},
		{
			title: "Quantum Foundations and the Hadamard Transform",
			sections: [
				{
					title: "Quantum states, amplitudes, and measurement",
					summary:
						"Introduces qubits and superposition from a linear-algebra starting point. Covers the measurement rule and unitary evolution.",
				},
				{
					title: "Tensor products and multiqubit systems",
					summary:
						"Describes how systems combine through tensor products. Explains product states, entanglement, and the exponential size of the state space.",
				},
				{
					title: "The Hadamard gate and its tensor powers",
					summary:
						"Defines the Hadamard gate and applies it to every qubit of a register. The result is exactly the normalized matrix from Chapter 2.",
				},
				{
					title: "Computational and Hadamard bases",
					summary:
						"Treats the two bases as complementary views of the same state. Measuring in the Hadamard basis is the operation that reveals Fourier information.",
				},
				{
					title: "Quantum oracles and phase kickback",
					summary:
						"Explains how a classical function becomes a reversible quantum operation. Phase kickback then turns function values into phases.",
				},
				{
					title: "Quantum Fourier sampling",
					summary:
						"Combines the previous sections into one primitive: prepare a state, transform it, and measure. Outcomes are distributed by the squared Fourier coefficients.",
				},
			],
		},
		{
			title: "Elementary Quantum Query Algorithms",
			sections: [
				{
					title: "The quantum query model",
					summary:
						"Defines query complexity and explains why it is the right setting for clean separations. Fixes how queries are counted, classically and quantumly.",
				},
				{
					title: "Deutsch’s algorithm",
					summary:
						"Decides a one-bit global property of a function with a single query. It is the smallest example of interference doing useful work.",
				},
				{
					title: "The Bernstein–Vazirani algorithm",
					summary:
						"Recovers a hidden parity with one query. This is Fourier sampling applied to a function with a single nonzero coefficient.",
				},
				{
					title: "The Deutsch–Jozsa algorithm",
					summary:
						"Distinguishes constant functions from balanced ones with one query. The analysis reads the answer off a single Fourier coefficient.",
				},
				{
					title: "Classical and quantum query complexity",
					summary:
						"Compares deterministic, randomized, and quantum costs for these problems. Notes what each separation does and does not prove.",
				},
			],
		},
		{
			title: "Simon’s Algorithm and Hidden Structure",
			sections: [
				{
					title: "Hidden XOR periods",
					summary:
						"States Simon’s problem: a function that repeats under XOR with a secret string. Explains why classical algorithms need many queries to find it.",
				},
				{
					title: "Coset states and interference",
					summary:
						"Shows that one query and a measurement leave a uniform superposition over a coset. Interference then cancels most outcomes after the transform.",
				},
				{
					title: "Fourier sampling and orthogonal subspaces",
					summary:
						"Proves that each measurement returns a string orthogonal to the hidden period. The orthogonal subspace is the key structure of the algorithm.",
				},
				{
					title: "Recovering the hidden period",
					summary:
						"Collects enough independent samples and solves a linear system over 𝔽₂. Includes the probabilistic analysis of how many rounds are needed.",
				},
				{
					title: "Exponential quantum query advantages",
					summary:
						"Compares the quantum and classical query counts. Explains the sense in which this separation is exponential and relative to an oracle.",
				},
				{
					title: "The abelian hidden subgroup perspective",
					summary:
						"Rephrases Simon’s problem as a hidden subgroup problem. This framework unifies the algorithm with its relatives in Chapter 8.",
				},
			],
		},
		{
			title: "Quantum Search and Amplitude Amplification",
			sections: [
				{
					title: "Uniform superposition preparation",
					summary:
						"Uses tensor powers of the Hadamard gate to prepare the starting state. Every input carries equal amplitude before the search begins.",
				},
				{
					title: "Phase oracles and reflections",
					summary:
						"Shows that a phase oracle acts as a reflection. Sets up the geometric view that drives the analysis.",
				},
				{
					title: "Hadamard conjugation and the diffusion operator",
					summary:
						"Builds the second reflection by conjugating a simple phase flip with Hadamards. This is the Walsh–Hadamard transform’s role inside Grover’s algorithm.",
				},
				{
					title: "Grover’s algorithm",
					summary:
						"Combines both reflections into a rotation toward the marked items. Derives the quadratic speedup and the right number of iterations.",
				},
				{
					title: "General amplitude amplification",
					summary:
						"Replaces uniform superposition with any preparation procedure. Grover’s algorithm becomes one case of a general way to boost success probability.",
				},
			],
		},
		{
			title: "Extensions and Limitations",
			sections: [
				{
					title: "Walsh–Hadamard versus the cyclic quantum Fourier transform",
					summary:
						"Contrasts Fourier analysis over the hypercube with Fourier analysis over cyclic groups. Compares their structure and their circuits.",
				},
				{
					title: "Connections to period finding and Shor’s algorithm",
					summary:
						"Shows how Simon’s algorithm anticipates period finding over the integers. Sketches the path from there to factoring without developing it in full.",
				},
				{
					title: "Quantum learning through Fourier sampling",
					summary:
						"Returns to the learning problems of Chapter 3 with quantum access to examples. Discusses what Fourier sampling gains over classical sampling.",
				},
				{
					title: "State preparation and measurement costs",
					summary:
						"Accounts for costs that query counts hide. Considers what it takes to load data into a state and to read answers out.",
				},
				{
					title: "Query advantages versus computational speedups",
					summary:
						"Separates oracle results from claims about real running time. Closes with what these algorithms do and do not establish.",
				},
			],
		},
	],
	sources: [
		{
			work: "Ryan O’Donnell, Analysis of Boolean Functions, especially Chapters 1–3",
			chapters: "1–3",
		},
		{
			work: "O’Donnell and Wright, Quantum Computation lecture notes, especially Lectures 4–10",
			chapters: "4–8",
		},
		{
			work: "John Watrous, IBM Quantum Learning, “Quantum query algorithms”",
			chapters: "4–6",
		},
		{ work: "IBM Quantum Learning, “Grover’s algorithm”", chapters: "7" },
		{
			work: "Andrew Childs, Lecture Notes on Quantum Algorithms, especially Chapters 4–6 and 19",
			chapters: "6–8",
		},
	],
};
