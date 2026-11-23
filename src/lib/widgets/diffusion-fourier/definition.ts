import { defineWidget } from "../contract.ts";

// The buttons (2.75rem) and two panels, with two 0.75rem gaps. A panel is its border (2px),
// its padding (1.5rem), the title (1.75rem), a 0.5rem gap and a chart of 9.4375rem. Eight
// columns set their numbers smaller, which makes it 3px shorter.
export default defineWidget({
	props: {
		qubits: { type: "integer", default: 2, min: 2, max: 3 },
	},
	height: "calc(30.625rem + 4px)",
});
