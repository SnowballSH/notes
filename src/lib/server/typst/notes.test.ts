import { describe, expect, it } from "vitest";
import { compileNote, listNotes, parseMeta } from "./notes";

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

describe("parseMeta", () => {
	const header = { title: "Unions", summary: null, order: 1, draft: false };

	it("reads the one header of a note", () => {
		expect(parseMeta([header], "notes/sets/unions.typ")).toEqual(header);
	});

	it("refuses a note without a header, or with more than one", () => {
		expect(() => parseMeta([], "notes/sets/unions.typ")).toThrow(
			"notes/sets/unions.typ: the note must start with #show: note.with(title: ..)",
		);
		expect(() => parseMeta([header, header], "notes/sets/unions.typ")).toThrow(
			"notes/sets/unions.typ: the note has 2 #show: note.with(..) headers; keep one",
		);
	});

	it("refuses a blank title", () => {
		expect(() => parseMeta([{ ...header, title: "  " }], "n.typ")).toThrow("needs a title");
	});
});
