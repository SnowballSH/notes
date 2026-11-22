import { defineWidget } from "../contract.ts";
import { presetNames } from "./circuit.ts";

export default defineWidget({
	props: {
		qubits: { type: "integer", default: 2, min: 2, max: 4 },
		preset: { type: "choice", options: presetNames, default: "and" },
	},
});
