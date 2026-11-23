import { formatAmplitude, ket } from "../../quantum/format.ts";
import { type Random, sampleIndex } from "../../quantum/sampling.ts";
import {
	type Amplitudes,
	basisState,
	hadamardOnEveryQubit,
	probabilities,
} from "../../quantum/state.ts";

export type Step = { kind: "hadamard" } | { kind: "measurement"; qubit: number; coin: number };

export type Terms = readonly [number, number];

export interface Experiment {
	qubit: Amplitudes;
	coin: readonly number[];
	steps: readonly Step[];
	terms?: readonly Terms[];
}

const definite = (bit: number): Amplitudes => basisState(1, bit);

export const start: Experiment = { qubit: definite(0), coin: definite(0), steps: [] };

export function hadamardTerms([zero = 0, one = 0]: Amplitudes): [Terms, Terms] {
	const fromZero = zero * Math.SQRT1_2;
	const fromOne = one * Math.SQRT1_2;
	return [
		[fromZero, fromOne],
		[fromZero, -fromOne],
	];
}

export const toss = (coin: readonly number[]): number[] => {
	const whole = coin.reduce((sum, probability) => sum + probability, 0);
	return coin.map(() => whole / coin.length);
};

export function applyHadamard(experiment: Experiment): Experiment {
	return {
		qubit: hadamardOnEveryQubit(experiment.qubit),
		coin: toss(experiment.coin),
		steps: [...experiment.steps, { kind: "hadamard" }],
		terms: hadamardTerms(experiment.qubit),
	};
}

export function measure(experiment: Experiment, random: Random): Experiment {
	const qubit = sampleIndex(probabilities(experiment.qubit), random);
	const coin = sampleIndex(experiment.coin, random);
	return {
		qubit: definite(qubit),
		coin: definite(coin),
		steps: [...experiment.steps, { kind: "measurement", qubit, coin }],
	};
}

const isCertain = (probability: number): boolean => Math.abs(probability - 1) < 1e-9;

export const definiteBit = (state: Amplitudes): number | undefined => {
	const bit = probabilities(state).findIndex(isCertain);
	return bit === -1 ? undefined : bit;
};

export function stateName(state: Amplitudes): string {
	const bit = definiteBit(state);
	if (bit !== undefined) return ket(String(bit));
	return ket((state[0] ?? 0) * (state[1] ?? 0) > 0 ? "+" : "−");
}

export const cancels = ([first, second]: Terms): boolean =>
	first !== 0 && Math.abs(first + second) < 1e-9;

export const formatTerms = (terms: Terms): string => terms.map(formatAmplitude).join(" ");

export const faces = ["heads", "tails"] as const;

export const coinName = (coin: readonly number[]): string =>
	faces[coin.findIndex(isCertain)] ?? "tossed";

export function summarise({ qubit, coin, steps, terms }: Experiment): string {
	const last = steps.at(-1);
	const cancelled = terms?.findIndex(cancels) ?? -1;
	const qubitNow =
		last?.kind === "measurement"
			? `Measured ${last.qubit}: qubit ${stateName(qubit)}`
			: cancelled === -1
				? `Qubit ${stateName(qubit)}`
				: `Qubit ${stateName(qubit)}, the ${ket(String(cancelled))} terms cancel`;
	return `${qubitNow}; coin ${coinName(coin)}.`;
}

export function result({ steps }: Experiment): string {
	const last = steps.at(-1);
	return last?.kind === "measurement" ? `Measured ${last.qubit}` : "";
}

export function describeStep(step: Step): string {
	return step.kind === "hadamard" ? "H" : `measure: ${step.qubit}`;
}
