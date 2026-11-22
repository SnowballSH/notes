import { describe, expect, it } from "vitest";
import type { NotesOutline } from "../../outlines/types";
import { walshHadamard } from "../../outlines/walsh-hadamard";
import { dependencies } from "./dependencies";
import { needsText, roadmapSections } from "./sections";

describe("the sections of the roadmap", () => {
	const sections = roadmapSections(walshHadamard, dependencies);

	it("numbers and titles them from the outline, in its order", () => {
		expect(sections.map(({ number, title }) => `${number} ${title}`)).toEqual([
			"2.1 Boolean functions and Fourier expansions",
			"2.2 The Walsh-Hadamard transform",
			"2.3 XOR convolution",
			"2.4 Classical applications",
			"3.1 Qubits, measurement, and the Hadamard gate",
			"3.2 Quantum oracles and Fourier sampling",
			"4.1 Grover's algorithm",
		]);
	});

	it("gives a section with a note its address, and one without a note none", () => {
		const outline: NotesOutline = {
			title: "Course",
			description: "",
			sources: [],
			chapters: [
				{ title: "One", sections: [{ title: "Skipped", summary: "", note: "skipped" }] },
				{
					title: "Two",
					sections: [
						{ title: "Written", summary: "", note: "written" },
						{ title: "Planned", summary: "" },
					],
				},
			],
		};
		expect(roadmapSections(outline, { "2.1": [], "2.2": ["2.1"] })).toEqual([
			{ number: "2.1", title: "Written", href: "/walsh-hadamard/written", needs: [] },
			{ number: "2.2", title: "Planned", href: null, needs: ["2.1"] },
		]);
	});

	it("carries what each section needs", () => {
		expect(sections.find(({ number }) => number === "2.4")?.needs).toEqual(["2.1", "2.3"]);
	});

	it("says what a section needs", () => {
		expect(needsText([])).toBe("");
		expect(needsText(["2.1"])).toBe(", needs 2.1");
		expect(needsText(["2.1", "2.3"])).toBe(", needs 2.1 and 2.3");
		expect(needsText(["2.1", "2.2", "2.3"])).toBe(", needs 2.1, 2.2 and 2.3");
	});
});
