import { defineWidget } from "../contract.ts";

export default defineWidget({
	props: {
		size: { type: "integer", default: 4, min: 1, max: 8 },
	},
});
