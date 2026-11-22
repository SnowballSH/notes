import { formatAmplitude, ket } from "../../quantum/format.ts";
import { type Random, sampleIndex } from "../../quantum/sampling.ts";
import {
	type Amplitudes,
	basisState,
	hadamardOnEveryQubit,
	probabilities,
} from "../../quantum/state.ts";

export type Step = { kind: "hadamard" } | { kind: "measurement"; qubit: number; coin: number };

/** The two terms the Hadamard gate adds to give the amplitude of one basis state. */
export type Terms = readonly [number, number];

/** A qubit and a classical coin taken through the same steps, side by side. */
export interface Experiment {
	qubit: Amplitudes;
	/** The probabilities that the classical coin shows 0 and 1. */
	coin: readonly number[];
	steps: readonly Step[];
	/** For each basis state, what the last step contributed, when that step was a Hadamard gate. */
	terms?: readonly Terms[];
}

const definite = (bit: number): number[] => [...basisState(1, bit)];

export const start: Experiment = { qubit: definite(0), coin: definite(0), steps: [] };

export function hadamardTerms([zero = 0, one = 0]: Amplitudes): [Terms, Terms] {
	const fromZero = zero * Math.SQRT1_2;
	const fromOne = one * Math.SQRT1_2;
	return [
		[fromZero, fromOne],
		[fromZero, -fromOne],
	];
}

/** A fair toss forgets what the coin showed: each face gets half of the total probability. */
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

/** Measures the qubit and looks at the coin; each is left showing what was seen. */
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

/** The name of a state this experiment can reach: a definite bit or one of the two fair coins. */
export function stateName(state: Amplitudes): string {
	const bit = definiteBit(state);
	if (bit !== undefined) return ket(String(bit));
	return ket((state[0] ?? 0) * (state[1] ?? 0) > 0 ? "+" : "−");
}

export const cancels = ([first, second]: Terms): boolean =>
	first !== 0 && Math.abs(first + second) < 1e-9;

export const formatTerms = (terms: Terms): string => terms.map(formatAmplitude).join(" ");

const describeCoin = (coin: readonly number[]): string => {
	const face = coin.findIndex(isCertain);
	return face === -1 ? "coin fair" : `coin ${face}`;
};

/** The state of both sides in a few words, for the caption. */
export function summarise({ qubit, coin, steps, terms }: Experiment): string {
	const last = steps.at(-1);
	const cancelled = terms?.findIndex(cancels) ?? -1;
	const qubitNow =
		last?.kind === "measurement"
			? `Measured ${last.qubit}: qubit ${stateName(qubit)}`
			: cancelled === -1
				? `Qubit ${stateName(qubit)}`
				: `Qubit ${stateName(qubit)}, the ${ket(String(cancelled))} terms cancel`;
	return `${qubitNow}; ${describeCoin(coin)}.`;
}

export function describeStep(step: Step): string {
	return step.kind === "hadamard" ? "H" : `measure: ${step.qubit}`;
}
