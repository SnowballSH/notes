import { ket } from "../../quantum/format.ts";

export const kinds = ["fourier-sampling", "grover"] as const;
export type Kind = (typeof kinds)[number];

/** The name of a gate: a letter with an optional superscript and subscript. */
export interface GateLabel {
	base: string;
	sup?: string;
	sub?: string;
}

export const hadamardOnEveryQubit: GateLabel = { base: "H", sup: "⊗n" };
export const signOracle: GateLabel = { base: "O", sup: "±", sub: "f" };
export const diffusion: GateLabel = { base: "D" };
export const signFlipOffZero: GateLabel = { base: "Z", sub: "0" };

export const zeroKet = ket("0");
export const repetitions = "× T";
export const diffusionName = "D =";

const hadamards = "a Hadamard gate on every qubit";
const start = `Circuit on n qubits, each starting in ${zeroKet}`;
const end = "then every qubit is measured";

const descriptions: Record<Kind, string> = {
	"fourier-sampling": `${start}: ${hadamards}, then one query to the sign oracle of f, then ${hadamards}, ${end}.`,
	grover: `${start}: ${hadamards}, then T repetitions of the sign oracle of f followed by the diffusion gate D, ${end}.`,
};

/** The circuit read out from left to right. */
export const describeCircuit = (kind: Kind): string => descriptions[kind];

export const diffusionDescription = `The diffusion gate D on n qubits: ${hadamards}, then Z0, which flips the sign of every basis state except ${ket("0…0")}, then ${hadamards}.`;
