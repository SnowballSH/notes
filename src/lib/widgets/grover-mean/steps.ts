import { formatAmplitude, formatDyadic } from "../../quantum/format.ts";
import {
	groverIteration,
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
	for (let iteration = 0; iteration < iterationsDone(steps); iteration++)
		state = groverIteration(state, markedInputs);
	return settled(nextStep(steps) === "diffuse" ? signOracle(state, markedInputs) : state);
}

const countIterations = (count: number): string =>
	count === 1 ? "1 iteration" : `${count} iterations`;

/** The caption: the chance of measuring the marked input, which a query alone leaves as it was. */
export function caption(qubits: number, marked: number, steps: number): string {
	const chance = formatDyadic(successProbability(2 ** qubits, 1, iterationsDone(steps)));
	return `P(${bitstring(marked, qubits)}) = ${chance}`;
}

/** The same in a sentence, for a screen reader. */
export function spokenSummary(qubits: number, marked: number, steps: number): string {
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

/** The number under a bar: exact where it is short, with a sign only when negative, since the bar shows the direction. */
export const shownAmplitude = (amplitude: number): string =>
	formatAmplitude(amplitude).replace(/^\+/, "");

/** The label on the line of the average. */
export const meanLabel = (state: Amplitudes): string => `μ = ${shownAmplitude(mean(state))}`;

export const plotScales = [0.5, 1] as const;

const scaleTolerance = 1e-9;

/** The amplitude drawn at the full height of the plot: the smallest of the fixed scales that holds every bar. */
export function plotScale(state: Amplitudes): number {
	const largest = Math.max(...state.map(Math.abs));
	return plotScales.find((scale) => largest <= scale + scaleTolerance) ?? 1;
}

/** One bar in words, for a screen reader, with its exact amplitude. */
export const describeColumn = (label: string, amplitude: number, marked: boolean): string =>
	[
		`${label}:`,
		marked && "marked,",
		`amplitude ${formatAmplitude(amplitude)},`,
		`probability ${formatDyadic(amplitude ** 2)}`,
	]
		.filter(Boolean)
		.join(" ");
