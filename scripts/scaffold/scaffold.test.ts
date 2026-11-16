import { describe, expect, it } from "vitest";
import {
	nextOrder,
	noteNextSteps,
	notePath,
	noteRequestProblem,
	noteSource,
	parseNoteArguments,
} from "./note";
import { widgetNameProblem, widgetScaffold } from "./widget";

describe("widgetNameProblem", () => {
	it("refuses a name that would sit beside a shared file of the same name", () => {
		expect(widgetNameProblem("widget-frame")).toContain("every widget shares");
		expect(widgetNameProblem("contract")).toContain("every widget shares");
	});

	it("accepts lowercase words joined by hyphens", () => {
		expect(widgetNameProblem("demo-counter")).toBeUndefined();
	});

	it.each([undefined, "", "DemoCounter", "demo_counter", "demo counter", "2d-fft", "demo-"])(
		"refuses %j",
		(name) => {
			expect(widgetNameProblem(name)).toBeTypeOf("string");
		},
	);
});

describe("widgetScaffold", () => {
	it("puts the definition and the component in a directory named after the widget", () => {
		const { directory, files, usage } = widgetScaffold("demo-counter");
		expect(directory).toBe("src/lib/widgets/demo-counter");
		expect(files.map((file) => file.path)).toEqual([
			"src/lib/widgets/demo-counter/definition.ts",
			"src/lib/widgets/demo-counter/DemoCounter.svelte",
		]);
		expect(usage).toBe('#widget("demo-counter")[Shown until the widget loads.]');
	});
});

describe("noteRequestProblem", () => {
	it("accepts names the site can serve", () => {
		expect(
			noteRequestProblem("walsh-hadamard", "fast-transform", "The fast transform"),
		).toBeUndefined();
	});

	it("refuses a missing part, a bad name and the library directory", () => {
		expect(noteRequestProblem("walsh-hadamard", "fast-transform", "")).toContain("give a course");
		expect(noteRequestProblem("walsh-hadamard", undefined, "")).toContain("give a course");
		expect(noteRequestProblem("Walsh", "fast-transform", "T")).toContain(
			'"Walsh" is not a valid name',
		);
		expect(noteRequestProblem("walsh-hadamard", "fast_transform", "T")).toContain(
			'"fast_transform" is not a valid name',
		);
		expect(noteRequestProblem("lib", "notes", "T")).toContain("not a course");
	});
});

describe("nextOrder", () => {
	const header = (order: string) => `#show: note.with(\n  title: "A",\n  ${order}\n)\n`;

	it("starts a new course at 1", () => {
		expect(nextOrder([])).toBe(1);
	});

	it("follows the highest order of the course, whatever the order of the files", () => {
		expect(nextOrder([header("order: 4,"), header("order: 2,"), header("order:10")])).toBe(11);
		expect(nextOrder(['#show: note.with(title: "A", summary: "B", order: 3)\n'])).toBe(4);
	});

	it("ignores a note without an order", () => {
		expect(nextOrder(['#show: note.with(title: "A")\n', header("order: 1,")])).toBe(2);
	});
});

describe("parseNoteArguments", () => {
	it("reads the course, the slug and the title", () => {
		expect(parseNoteArguments(["sets", "unions", "Unions", "of", "sets"])).toEqual({
			course: "sets",
			slug: "unions",
			title: "Unions of sets",
			startsCourse: false,
		});
	});

	it("takes --new-course wherever it stands, and no other option", () => {
		expect(parseNoteArguments(["--new-course", "sets", "unions", "Unions"]).startsCourse).toBe(
			true,
		);
		expect(parseNoteArguments(["sets", "unions", "Unions", "--new-course"])).toMatchObject({
			title: "Unions",
			startsCourse: true,
		});
		expect(parseNoteArguments(["sets", "--force", "unions", "Unions"]).unknownOption).toBe(
			"--force",
		);
	});

	it("leaves dashes in the title alone", () => {
		expect(parseNoteArguments(["sets", "intro", "Sets", "--", "a", "first", "look"])).toMatchObject(
			{
				title: "Sets -- a first look",
			},
		);
		expect(parseNoteArguments(["sets", "intro", "  "]).title).toBe("");
	});
});

describe("noteSource", () => {
	it("writes the header with the title quoted for Typst and the given order", () => {
		const source = noteSource('The "fast" transform', { order: 3 });
		expect(source).toMatch(/^#import "\/lib\/notes\.typ": \*\n#show: note\.with\(\n/);
		expect(source).toContain('  title: "The \\"fast\\" transform",\n');
		expect(source).toContain("  order: 3,\n  draft: true,\n)\n");
		expect(nextOrder([source])).toBe(4);
	});

	it("starts a note of a course with an outline as a draft, without an order", () => {
		const source = noteSource("The fast transform", { outline: "src/lib/outlines/sets.ts" });
		expect(source).toContain("  draft: true,\n)\n");
		expect(source).not.toContain("order:");
	});

	it("goes to the note's place under notes/", () => {
		expect(notePath({ course: "walsh-hadamard", slug: "fast-transform" })).toBe(
			"notes/walsh-hadamard/fast-transform.typ",
		);
	});
});

describe("noteNextSteps", () => {
	const request = { course: "sets", slug: "unions", title: "Unions" };

	it("names the outline file and the line to add for a course with an outline", () => {
		const steps = noteNextSteps(request, { outline: "src/lib/outlines/sets.ts" });
		expect(steps).toContain("Created notes/sets/unions.typ as a draft");
		expect(steps).toContain("http://localhost:5173/sets/unions");
		expect(steps).toContain(
			'In src/lib/outlines/sets.ts, add this line to the section the note covers:\n       note: "unions",',
		);
		expect(steps).toContain("Write the note's summary in its header.");
		expect(steps).toContain("Remove draft: true from the header.");
	});

	it("reports the order for a course without an outline", () => {
		const steps = noteNextSteps(request, { order: 2 });
		expect(steps).toContain("Created notes/sets/unions.typ as a draft with order 2");
		expect(steps).toContain("remove draft: true");
		expect(steps).toContain("http://localhost:5173/sets/unions");
		expect(steps).not.toContain("src/lib/outlines");
	});
});
