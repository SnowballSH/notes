import { defineWidget } from "../contract.ts";
import { presetNames } from "./spectrum.ts";

export default defineWidget({
	props: {
		preset: { type: "choice", options: presetNames, default: "majority" },
	},
});
