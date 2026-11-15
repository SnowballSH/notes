import type { NotesOutline } from "./types";

export const walshHadamard: NotesOutline = {
	title: "The Walsh-Hadamard Transform",
	description: "The transform on bitstrings and its classical and quantum applications.",
	chapters: [
		{
			title: "The Walsh-Hadamard Transform",
			sections: [
				{
					title: "Boolean functions and Fourier expansions",
					summary: "Writing any function on bitstrings as a sum of parity functions.",
					href: "/walsh-hadamard/boolean-functions",
				},
				{
					title: "The Walsh-Hadamard transform",
					summary: "The matrix behind the transform and a fast way to apply it.",
					href: "/walsh-hadamard/walsh-hadamard",
				},
				{
					title: "Classical applications",
					summary:
						"XOR convolution, linearity testing, and an error-correcting code built from parity functions.",
				},
			],
		},
		{
			title: "Quantum Foundations",
			sections: [
				{
					title: "Qubits, measurement, and the Hadamard gate",
					summary:
						"Quantum states from linear algebra, and the gate that applies the transform to qubits.",
				},
				{
					title: "Quantum oracles and Fourier sampling",
					summary:
						"How a quantum computer queries a function, then applies the transform and measures.",
				},
			],
		},
		{
			title: "Quantum Applications",
			sections: [
				{
					title: "The Bernstein-Vazirani and Deutsch-Jozsa algorithms",
					summary:
						"Finding a hidden parity function, or telling constant from balanced, with a single query.",
				},
				{
					title: "Hidden XOR periods",
					summary: "Simon's problem: finding a secret string that a function repeats under.",
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
			chapters: "1",
		},
		{
			work: "O'Donnell and Wright, Quantum Computation lecture notes, especially Lectures 4-10",
			chapters: "2-3",
		},
		{
			work: 'John Watrous, IBM Quantum Learning, "Quantum query algorithms"',
			chapters: "2-3",
		},
		{ work: 'IBM Quantum Learning, "Grover\'s algorithm"', chapters: "3" },
		{
			work: "Andrew Childs, Lecture Notes on Quantum Algorithms, especially Chapters 4-6 and 19",
			chapters: "3",
		},
	],
};
