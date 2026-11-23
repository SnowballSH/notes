import { defineWidget } from "../contract.ts";
import { levels } from "./butterfly.ts";

// Buttons (2.75rem), the diagram (372 units tall, one unit a pixel from 288px of width up) and
// one caption line (1.3125rem), with two 0.75rem gaps between them.
export default defineWidget({
	props: {
		level: { type: "integer", default: 0, min: 0, max: levels },
	},
	height: "calc(5.5625rem + min(100vw - 2rem, 288px) * 372 / 288)",
});
