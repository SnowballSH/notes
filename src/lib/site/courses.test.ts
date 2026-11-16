import { describe, expect, it } from "vitest";
import { courseNotes } from "#lib/server/typst/notes.ts";
import { courses, coursesByCategory } from "./courses";
import { pageTitle } from "./title";

describe.each(courses)("the $slug course", (course) => {
	it("links from its outline exactly its notes, in reading order", async () => {
		const linked = course.outline.chapters
			.flatMap((chapter) => chapter.sections)
			.flatMap((section) => section.href ?? []);
		const notes = await courseNotes(course.slug);
		expect(linked).toEqual(notes.map((note) => note.href));
	});
});

describe("coursesByCategory", () => {
	it("lists every course once", () => {
		expect(coursesByCategory.flatMap(([, listed]) => listed)).toHaveLength(courses.length);
	});
});

describe("pageTitle", () => {
	it("names the page first and the site last", () => {
		expect(pageTitle("Parity", "Boolean functions")).toBe("Parity · Boolean functions · Notes");
		expect(pageTitle()).toBe("Notes");
	});

	it("leaves out a part that repeats the one before it", () => {
		expect(pageTitle("The Transform", "The transform")).toBe("The Transform · Notes");
	});
});
