import { formatAmplitude, formatDyadic } from "../../quantum/format.ts";
import {
	groverIteration,
	mean,
	signOracle,
	successProbability,
	uniformSuperposition,
} from "../../quantum/grover.ts";
import { type Amplitudes, bitstring, settled } from "../../quantum/state.ts";

export type Step = "query" | "diffuse";

export const nextStep = (steps: number): Step => (steps % 2 === 0 ? "query" : "diffuse");

export const iterationsDone = (steps: number): number => Math.floor(steps / 2);

export const defaultMarked = (qubits: number): number =>
	Number.parseInt("10".repeat(qubits).slice(0, qubits), 2);

export function stateAfter(qubits: number, marked: number, steps: number): Amplitudes {
	const markedInputs = new Set([marked]);
	let state = uniformSuperposition(qubits);
	for (let iteration = 0; iteration < iterationsDone(steps); iteration++)
		state = groverIteration(state, markedInputs);
	return settled(nextStep(steps) === "diffuse" ? signOracle(state, markedInputs) : state);
}

const countIterations = (count: number): string =>
	count === 1 ? "1 iteration" : `${count} iterations`;

const chanceAfter = (qubits: number, steps: number): string =>
	formatDyadic(successProbability(2 ** qubits, 1, iterationsDone(steps)));

export const caption = (qubits: number, marked: number, steps: number): string =>
	`P(${bitstring(marked, qubits)}) = ${chanceAfter(qubits, steps)}`;

export function spokenSummary(qubits: number, marked: number, steps: number): string {
	const label = bitstring(marked, qubits);
	const iterations = iterationsDone(steps);
	if (nextStep(steps) === "diffuse") {
		const average = formatAmplitude(mean(stateAfter(qubits, marked, steps)));
		return `Query ${iterations + 1} negates the amplitude of ${label}: the average μ is ${average}.`;
	}
	const when = iterations === 0 ? "Before any query" : `After ${countIterations(iterations)}`;
	return `${when}, ${label} is measured with probability ${chanceAfter(qubits, steps)}.`;
}

export const shownAmplitude = (amplitude: number): string =>
	formatAmplitude(amplitude).replace(/^\+/, "");

export const meanLabel = (state: Amplitudes): string => `μ = ${shownAmplitude(mean(state))}`;

const plotScales = [0.5, 1] as const;

const scaleTolerance = 1e-9;

export function plotScale(state: Amplitudes): number {
	const largest = Math.max(...state.map(Math.abs));
	return plotScales.find((scale) => largest <= scale + scaleTolerance) ?? 1;
}

export const describeColumn = (label: string, amplitude: number, marked: boolean): string =>
	[
		`${label}:`,
		marked && "marked,",
		`amplitude ${formatAmplitude(amplitude)},`,
		`probability ${formatDyadic(amplitude ** 2)}`,
	]
		.filter(Boolean)
		.join(" ");
