import { describe, expect, it } from "vitest";
import { nextOrder, notePath, noteRequestProblem, noteSource } from "./note";
import { widgetNameProblem, widgetScaffold } from "./widget";

describe("widgetNameProblem", () => {
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

describe("noteSource", () => {
	it("writes the header with the title quoted for Typst and the given order", () => {
		const source = noteSource('The "fast" transform', 3);
		expect(source).toMatch(/^#import "\/lib\/notes\.typ": \*\n#show: note\.with\(\n/);
		expect(source).toContain('  title: "The \\"fast\\" transform",\n');
		expect(source).toContain("  order: 3,\n");
		expect(nextOrder([source])).toBe(4);
	});

	it("goes to the note's place under notes/", () => {
		expect(notePath({ course: "walsh-hadamard", slug: "fast-transform" })).toBe(
			"notes/walsh-hadamard/fast-transform.typ",
		);
	});
});
