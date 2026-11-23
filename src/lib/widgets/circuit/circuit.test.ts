import { describe, expect, it } from "vitest";
import { describeCircuit, diffusionDescription } from "./circuit";

describe("the circuits read out", () => {
	it("reads Fourier sampling from left to right, with its one query in the middle", () => {
		expect(describeCircuit("fourier-sampling")).toBe(
			"Circuit on n qubits, each starting in |0⟩: a Hadamard gate on every qubit, then one query to the sign oracle of f, then a Hadamard gate on every qubit, then every qubit is measured.",
		);
	});

	it("reads Grover's algorithm with its repeated pair of gates", () => {
		expect(describeCircuit("grover")).toBe(
			"Circuit on n qubits, each starting in |0⟩: a Hadamard gate on every qubit, then T repetitions of the sign oracle of f followed by the diffusion gate D, then every qubit is measured.",
		);
	});

	it("reads D as a sign flip between two layers of Hadamard gates", () => {
		expect(diffusionDescription).toBe(
			"The diffusion gate D on n qubits: a Hadamard gate on every qubit, then Z0, which flips the sign of every basis state except |0…0⟩, then a Hadamard gate on every qubit.",
		);
	});
});
