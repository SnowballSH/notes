import { access } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { isName } from "#lib/notes/names.ts";
import { outlineFile, readingOrder } from "#lib/outlines/contents.ts";
import { loadCourseContents } from "#lib/server/site/courses.ts";
import { listNotes } from "#lib/server/typst/notes.ts";
import { categories, isCategorySlug } from "./categories";
import { courses, coursesByCategory, findCourseAt, outlineHref } from "./courses";
import { pageTitle } from "./title";

describe.each(courses)("the $slug course", (course) => {
	it("has an outline that agrees with its notes", async () => {
		const contents = await loadCourseContents(course, { showDrafts: false });
		expect(
			readingOrder(contents).every((section) => section.href.startsWith(`/${course.slug}/`)),
		).toBe(true);
	});

	it("keeps its outline in the file that error messages name", async () => {
		await expect(access(outlineFile(course.slug))).resolves.toBeUndefined();
	});

	it("is found at the address of its outline", () => {
		expect(outlineHref(course)).toBe(`/${course.category.slug}/${course.slug}`);
		expect(findCourseAt(course.category.slug, course.slug)).toBe(course);
	});
});

describe("the course registry", () => {
	it("serves the Walsh-Hadamard outline at its published address", () => {
		expect(courses.map(outlineHref)).toContain("/special-topics/walsh-hadamard");
	});

	it("registers each course once", () => {
		expect(new Set(courses.map((course) => course.slug)).size).toBe(courses.length);
	});
});

describe("categories", () => {
	const slugs = Object.values(categories).map((category) => category.slug);

	it("have distinct slugs that the site can serve", () => {
		expect(new Set(slugs).size).toBe(slugs.length);
		expect(slugs.every(isName)).toBe(true);
	});

	it("are recognised by slug", () => {
		expect(slugs.every(isCategorySlug)).toBe(true);
		expect(isCategorySlug("walsh-hadamard")).toBe(false);
	});

	it("never share a slug with a directory of notes, whose pages would be hidden", async () => {
		const directories = new Set((await listNotes()).map((note) => note.course));
		expect(slugs.filter((slug) => directories.has(slug))).toEqual([]);
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
