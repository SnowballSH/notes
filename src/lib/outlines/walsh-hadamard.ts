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
					note: "grover",
				},
			],
		},
	],
	sources: [
		{
			work: "Ryan O'Donnell, Analysis of Boolean Functions, especially Chapter 1",
			chapters: "2",
		},
		{ work: 'Wolfram MathWorld, "Hadamard Matrix" and "Walsh Function"', chapters: "2" },
		{
			work: "O'Donnell and Wright, Quantum Computation lecture notes, Lectures 1, 2 and 4-6",
			chapters: "3-4",
		},
		{
			work: 'Ethan Bernstein and Umesh Vazirani, "Quantum Complexity Theory", 1997',
			chapters: "3",
		},
		{
			work: 'David Deutsch and Richard Jozsa, "Rapid Solution of Problems by Quantum Computation", 1992',
			chapters: "3",
		},
		{
			work: 'Lov Grover, "A Fast Quantum Mechanical Algorithm for Database Search", 1996',
			chapters: "4",
		},
		{
			work: 'Michel Boyer, Gilles Brassard, Peter Høyer and Alain Tapp, "Tight Bounds on Quantum Searching", 1998',
			chapters: "4",
		},
		{
			work: 'Charles Bennett, Ethan Bernstein, Gilles Brassard and Umesh Vazirani, "Strengths and Weaknesses of Quantum Computing", 1997',
			chapters: "4",
		},
		{
			work: 'Robert Beals, Harry Buhrman, Richard Cleve, Michele Mosca and Ronald de Wolf, "Quantum Lower Bounds by Polynomials", 2001',
			chapters: "4",
		},
	],
};
