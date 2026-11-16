import { describe, expect, it } from "vitest";
import { compileNote, listNotes } from "./notes";

describe("the notes", () => {
	it("all compile without errors or warnings, drafts included", async () => {
		const notes = await listNotes();
		const outcomes = await Promise.allSettled(notes.map(compileNote));
		const problems = outcomes.flatMap((outcome, index) => {
			const name = `notes/${notes[index]?.course}/${notes[index]?.slug}.typ`;
			if (outcome.status === "rejected") return [String(outcome.reason.message ?? outcome.reason)];
			return outcome.value.warnings.map((warning) => `${name}: ${warning}`);
		});
		expect(problems.join("\n\n")).toBe("");
	}, 60_000);
});
