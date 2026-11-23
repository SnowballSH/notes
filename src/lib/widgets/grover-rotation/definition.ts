import { defineWidget } from "../contract.ts";

export const fewestQubits = 2;
export const mostQubits = 8;

// No height: the controls wrap in a narrow window.
export default defineWidget({
	props: {
		qubits: { type: "integer", default: 3, min: fewestQubits, max: mostQubits },
		marked: { type: "integer", default: 1, min: 1 },
	},
});
