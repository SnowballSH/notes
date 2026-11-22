import { formatAmplitude, formatDyadic } from "../../quantum/format.ts";
import {
	invertAboutMean,
	mean,
	signOracle,
	successProbability,
	uniformSuperposition,
} from "../../quantum/grover.ts";
import { type Amplitudes, bitstring, settled } from "../../quantum/state.ts";

/** An iteration is two steps: the query, then the diffusion gate. */
export type Step = "query" | "diffuse";

export const nextStep = (steps: number): Step => (steps % 2 === 0 ? "query" : "diffuse");

export const iterationsDone = (steps: number): number => Math.floor(steps / 2);

/** The input marked to begin with: the bitstring 1010… of the right length. */
export const defaultMarked = (qubits: number): number =>
	Number.parseInt("10".repeat(qubits).slice(0, qubits), 2);

/** The amplitudes after the given number of steps from the uniform superposition. */
export function stateAfter(qubits: number, marked: number, steps: number): Amplitudes {
	const markedInputs = new Set([marked]);
	let state = uniformSuperposition(qubits);
	for (let step = 0; step < steps; step++) {
		state = nextStep(step) === "query" ? signOracle(state, markedInputs) : invertAboutMean(state);
	}
	return settled(state);
}

const countIterations = (count: number): string =>
	count === 1 ? "1 iteration" : `${count} iterations`;

/** The caption: the chance of measuring the marked input, or mid-iteration the average. */
export function caption(qubits: number, marked: number, steps: number): string {
	if (nextStep(steps) === "diffuse") {
		const average = formatAmplitude(mean(stateAfter(qubits, marked, steps)));
		return `μ = ${average.replace(/^\+/, "")}`;
	}
	const chance = formatDyadic(successProbability(2 ** qubits, 1, iterationsDone(steps)));
	return `P(${bitstring(marked, qubits)}) = ${chance}`;
}

/** The same in a sentence, for a screen reader. */
export function describe(qubits: number, marked: number, steps: number): string {
	const label = bitstring(marked, qubits);
	const iterations = iterationsDone(steps);
	if (nextStep(steps) === "diffuse") {
		const average = formatAmplitude(mean(stateAfter(qubits, marked, steps)));
		return `Query ${iterations + 1} negates the amplitude of ${label}: the average μ is ${average}.`;
	}
	const chance = formatDyadic(successProbability(2 ** qubits, 1, iterations));
	const when = iterations === 0 ? "Before any query" : `After ${countIterations(iterations)}`;
	return `${when}, ${label} is measured with probability ${chance}.`;
}
