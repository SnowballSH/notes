import { defineWidget } from "../contract.ts";
import { kinds } from "./circuit.ts";

/** No height: the two kinds differ in height, and the Grover circuit grows when D is shown. */
export default defineWidget({
	props: {
		kind: { type: "choice", options: kinds, default: "fourier-sampling" },
	},
});
