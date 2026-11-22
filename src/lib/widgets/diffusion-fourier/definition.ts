import { defineWidget } from "../contract.ts";

/**
 * The buttons (2.75rem), two panels and one caption line (1.3125rem), with three 0.75rem gaps.
 * A panel is its border (2px), its padding (1.5rem), the title (1.75rem), a 0.5rem gap and a
 * chart of 10.6875rem. Eight columns set their numbers smaller, which makes it 3px shorter.
 */
export default defineWidget({
	props: {
		qubits: { type: "integer", default: 2, min: 2, max: 3 },
	},
	height: "calc(35.1875rem + 4px)",
});
