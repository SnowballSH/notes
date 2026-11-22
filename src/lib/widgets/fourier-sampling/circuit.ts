import { formatDyadic } from "../../quantum/format.ts";
import { signOracle, uniformSuperposition } from "../../quantum/grover.ts";
import { type Random, sampleIndex } from "../../quantum/sampling.ts";
import {
	type Amplitudes,
	bitstring,
	hadamardOnEveryQubit,
	probabilities,
	qubitCount,
	settled,
} from "../../quantum/state.ts";

export type Bit = 0 | 1;

/** The values of a function from bitstrings to bits, indexed by its inputs read as binary numbers. */
export type TruthTable = readonly Bit[];

export const presetNames = ["and", "parity", "constant", "balanced", "one-marked"] as const;

export type PresetName = (typeof presetNames)[number];

const hasOddWeight = (input: number): boolean => {
	let ones = 0;
	for (let rest = input; rest > 0; rest >>= 1) ones += rest & 1;
	return ones % 2 === 1;
};

const presetRules: Record<PresetName, (input: number, qubits: number) => boolean> = {
	and: (input, qubits) => input === 2 ** qubits - 1,
	parity: (input) => hasOddWeight(input),
	constant: () => false,
	balanced: (input, qubits) => input >= 2 ** (qubits - 1),
	"one-marked": (input) => input === 1,
};

export const presetTable = (preset: PresetName, qubits: number): TruthTable =>
	Array.from({ length: 2 ** qubits }, (_, input) => (presetRules[preset](input, qubits) ? 1 : 0));

export const toggled = (table: TruthTable, input: number): TruthTable =>
	table.with(input, table[input] === 1 ? 0 : 1);

export const sameTable = (first: TruthTable, second: TruthTable): boolean =>
	first.length === second.length && first.every((value, input) => value === second[input]);

const markedInputs = (table: TruthTable): Set<number> =>
	new Set(table.flatMap((value, input) => (value === 1 ? [input] : [])));

/** The state after each step of Fourier sampling, which starts from all zeros. */
export interface Stages {
	afterHadamard: Amplitudes;
	afterQuery: Amplitudes;
	afterSecondHadamard: Amplitudes;
}

export function fourierSampling(table: TruthTable): Stages {
	const afterHadamard = uniformSuperposition(qubitCount(table));
	const afterQuery = signOracle(afterHadamard, markedInputs(table));
	return {
		afterHadamard,
		afterQuery,
		afterSecondHadamard: settled(hadamardOnEveryQubit(afterQuery)),
	};
}

export const emptyTally = (outcomes: number): readonly number[] =>
	Array.from({ length: outcomes }, () => 0);

export const recorded = (tally: readonly number[], outcome: number): readonly number[] =>
	tally.with(outcome, (tally[outcome] ?? 0) + 1);

export const measure = (state: Amplitudes, random: Random): number =>
	sampleIndex(probabilities(state), random);

const tolerance = 1e-9;

/** One line on what measuring the state gives: its likeliest outcomes and their probability. */
export function describeOutcomes(state: Amplitudes): string {
	const chances = probabilities(state);
	const highest = Math.max(...chances);
	const likeliest = chances.flatMap((chance, outcome) =>
		highest - chance < tolerance ? [bitstring(outcome, qubitCount(state))] : [],
	);
	const shown = formatDyadic(highest);
	if (1 - highest < tolerance) return `The outcome is always ${likeliest[0] ?? ""}.`;
	if (likeliest.length === chances.length) return `Every outcome has probability ${shown}.`;
	if (likeliest.length === 1)
		return `The likeliest outcome is ${likeliest[0] ?? ""}, with probability ${shown}.`;
	return `The ${likeliest.length} likeliest outcomes each have probability ${shown}.`;
}
