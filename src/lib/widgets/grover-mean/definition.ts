import { defineWidget } from "../contract.ts";

/** Eight bars with their numbers, each above its own marking button, are what fits in a note 288px wide. */
export const mostQubits = 3;

export default defineWidget({
	props: {
		qubits: { type: "integer", default: 3, min: 2, max: mostQubits },
	},
});
