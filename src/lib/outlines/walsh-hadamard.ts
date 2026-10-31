import type { NotesOutline } from "./types";

export const walshHadamard: NotesOutline = {
	title: "The Walsh-Hadamard Transform",
	description: "The transform on bitstrings and its classical and quantum applications.",
	chapters: [
		{
			title: "The Walsh-Hadamard Transform",
			sections: [
				{
					title: "Bitstrings and parity functions",
					summary: "Bitstrings, XOR, and the simple functions everything else is built from.",
				},
				{
					title: "Hadamard matrices and their recursive construction",
					summary: "How to build the matrix behind the transform, one step at a time.",
				},
				{
					title: "Walsh characters and Fourier expansions",
					summary: "Writing any function on bitstrings as a sum of parity functions.",
				},
				{
					title: "Orthogonality, inversion, and Parseval's identity",
					summary: "The basic facts that let us undo the transform.",
				},
				{
					title: "The fast Walsh-Hadamard transform",
					summary: "Computing the transform much faster than multiplying by the matrix.",
				},
			],
		},
		{
			title: "Classical Applications",
			sections: [
				{
					title: "Correlation analysis of Boolean functions",
					summary: "Measuring how close a function is to a parity function.",
				},
				{
					title: "XOR convolution",
					summary: "Combining two functions under XOR quickly with the transform.",
				},
				{
					title: "Linearity testing",
					summary:
						"Checking with a few random queries whether a function is close to a parity function.",
				},
				{
					title: "Hadamard codes and decoding",
					summary: "An error-correcting code built from parity functions.",
				},
			],
		},
		{
			title: "Quantum Foundations",
			sections: [
				{
					title: "Qubits, measurement, and tensor products",
					summary: "The basics of quantum states, starting from linear algebra.",
				},
				{
					title: "The Hadamard gate and its tensor powers",
					summary: "The quantum gate that applies the transform to a register of qubits.",
				},
				{
					title: "Quantum oracles and phase kickback",
					summary: "How a quantum computer queries a classical function.",
				},
				{
					title: "Quantum Fourier sampling",
					summary: "Applying the transform and measuring, the step most of the algorithms share.",
				},
			],
		},
		{
			title: "Quantum Applications",
			sections: [
				{
					title: "The Bernstein-Vazirani algorithm",
					summary: "Finding a hidden parity function with a single query.",
				},
				{
					title: "The Deutsch-Jozsa algorithm",
					summary: "Telling constant functions from balanced ones with a single query.",
				},
				{
					title: "Hidden XOR periods",
					summary: "Simon's problem: finding a secret string that a function repeats under.",
				},
				{
					title: "Recovering the hidden period",
					summary: "Turning the measurement results into the secret string.",
				},
				{
					title: "Grover's algorithm",
					summary: "Searching for a marked item with far fewer queries than a classical search.",
				},
			],
		},
	],
	sources: [
		{
			work: "Ryan O'Donnell, Analysis of Boolean Functions, especially Chapters 1-3",
			chapters: "1-2",
		},
		{
			work: "O'Donnell and Wright, Quantum Computation lecture notes, especially Lectures 4-10",
			chapters: "3-4",
		},
		{
			work: 'John Watrous, IBM Quantum Learning, "Quantum query algorithms"',
			chapters: "3-4",
		},
		{ work: 'IBM Quantum Learning, "Grover\'s algorithm"', chapters: "4" },
		{
			work: "Andrew Childs, Lecture Notes on Quantum Algorithms, especially Chapters 4-6 and 19",
			chapters: "4",
		},
	],
};
