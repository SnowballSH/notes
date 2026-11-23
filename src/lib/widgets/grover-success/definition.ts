import { defineWidget } from "../contract.ts";

export const fewestQubits = 2;
export const mostQubits = 10;

// No height: the controls and the caption wrap onto a second line in a narrow note.
export default defineWidget({
	props: {
		qubits: { type: "integer", default: 3, min: fewestQubits, max: mostQubits },
		marked: { type: "integer", default: 1, min: 1 },
	},
});
