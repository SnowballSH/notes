import type { NotesOutline } from "./types";

export const walshHadamard: NotesOutline = {
	title: "The Walsh-Hadamard Transform",
	description: "The transform on bitstrings and its classical and quantum applications.",
	chapters: [
		{
			title: "Introduction",
			sections: [
				{
					title: "Overview and prerequisites",
					summary:
						"What these notes cover, what you need to know first, and how the parts fit together.",
					note: "overview",
				},
			],
		},
		{
			title: "The Walsh-Hadamard Transform",
			sections: [
				{
					title: "Boolean functions and Fourier expansions",
					summary: "Writing any function on bitstrings as a sum of parity functions.",
					note: "boolean-functions",
				},
				{
					title: "The Walsh-Hadamard transform",
					summary: "The matrix behind the transform and a fast way to apply it.",
					note: "walsh-hadamard",
				},
				{
					title: "XOR convolution",
					summary: "Combining two functions on bitstrings quickly, using the fast transform.",
					note: "xor-convolution",
				},
				{
					title: "Classical applications",
					summary: "Linearity testing, and an error-correcting code built from parity functions.",
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
					note: "qubits",
				},
				{
					title: "Quantum oracles and Fourier sampling",
					summary:
						"How a quantum computer queries a function, then applies the transform and measures.",
					note: "oracles",
				},
			],
		},
		{
			title: "Quantum Applications",
			sections: [
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
			chapters: "2",
		},
		{
			work: "O'Donnell and Wright, Quantum Computation lecture notes, especially Lectures 1-10",
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
