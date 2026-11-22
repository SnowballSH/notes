import { describe, expect, it } from "vitest";
import { siteOrigin } from "#lib/site/title.ts";
import { compileNote, listNotes, parseMeta, printInputs, printNote } from "./notes";

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

describe("the PDF edition", () => {
	const unplaced = { courseTitle: null, number: null };

	it("is set for every note without errors or warnings, drafts included", async () => {
		const notes = await listNotes();
		const outcomes = await Promise.allSettled(notes.map((note) => printNote(note, unplaced)));
		const problems = outcomes.flatMap((outcome, index) => {
			const name = `notes/${notes[index]?.course}/${notes[index]?.slug}.typ`;
			if (outcome.status === "rejected") return [String(outcome.reason.message ?? outcome.reason)];
			const signature = new TextDecoder().decode(outcome.value.pdf.slice(0, 5));
			return [
				...outcome.value.warnings.map((warning) => `${name}: ${warning}`),
				...(signature === "%PDF-" ? [] : [`${name}: not a PDF, it starts with ${signature}`]),
			];
		});
		expect(problems.join("\n\n")).toBe("");
	}, 60_000);

	it("is told its place on the site and where each noteref leads", async () => {
		const inputs = await printInputs(
			{ course: "guide", slug: "elements" },
			{ courseTitle: "A course", number: "2.1" },
		);
		expect(inputs).toMatchObject({
			print: "true",
			site: siteOrigin,
			path: "/guide/elements",
			course: "A course",
			number: "2.1",
		});
		expect(JSON.parse(inputs.references ?? "")).toEqual({
			"walsh-hadamard/boolean-functions#thm-plancherel": {
				href: `${siteOrigin}/walsh-hadamard/boolean-functions#thm-plancherel`,
				name: expect.stringMatching(/^Theorem \d+$/),
			},
		});
	}, 60_000);

	it("carries its links to the site: a noteref's card and a link written for the site", async () => {
		const linksOf = async (slug: string) => {
			const course = slug === "elements" ? "guide" : "walsh-hadamard";
			const { pdf } = await printNote({ course, slug }, unplaced);
			return new TextDecoder("latin1").decode(pdf);
		};
		expect(await linksOf("elements")).toContain(
			`${siteOrigin}/walsh-hadamard/boolean-functions#thm-plancherel`,
		);
		expect(await linksOf("xor-convolution")).toContain(
			`${siteOrigin}/walsh-hadamard/walsh-hadamard#implementation`,
		);
	}, 60_000);

	it("leaves out the course and the number of a note that has no place in an outline", async () => {
		const inputs = await printInputs({ course: "guide", slug: "elements" }, unplaced);
		expect(Object.keys(inputs).sort()).toEqual(["path", "print", "references", "site"]);
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
