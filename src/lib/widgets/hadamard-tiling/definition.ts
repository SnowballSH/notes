import { defineWidget } from "../contract.ts";

/** A larger matrix would give an entry less than a whole pixel of the 320px board. */
export const largestLevel = 6;

export default defineWidget({
	props: {
		start: { type: "integer", default: 1, min: 0, max: largestLevel },
		max: { type: "integer", default: largestLevel, min: 1, max: largestLevel },
	},
	height: "calc(7.125rem + min(100vw - 2rem, 20rem + 2px))",
});
