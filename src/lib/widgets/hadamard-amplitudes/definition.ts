import { defineWidget } from "../contract.ts";

// Eight bars with their numbers are what fits in a note 288px wide.
export const mostQubits = 3;

export default defineWidget({
	props: {
		qubits: { type: "integer", default: 2, min: 1, max: mostQubits },
	},
});
