import { defineWidget } from "../contract.ts";
import { levels } from "./butterfly.ts";

/**
 * Buttons, the diagram (372 units tall for 288 wide), the legend and one caption line,
 * with three 0.75rem gaps between them.
 */
export default defineWidget({
	props: {
		level: { type: "integer", default: 0, min: 0, max: levels },
	},
	height: "calc(7.625rem + min(100vw - 2rem, 24rem) * 372 / 288)",
});
