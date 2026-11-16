import { describe, expect, it } from "vitest";
import {
	allSections,
	courseContents,
	type NoteStatus,
	notePlace,
	type OutlinedCourse,
	OutlineError,
	outlineFile,
	outlineProblems,
	readingOrder,
	sectionNumber,
} from "./contents";

const course: OutlinedCourse = {
	slug: "sets",
	outline: {
		title: "Sets",
		description: "",
		chapters: [
			{
				title: "Basics",
				sections: [
					{ title: "Membership", summary: "In or out.", note: "membership" },
					{ title: "Subsets", summary: "Sets inside sets." },
				],
			},
			{
				title: "Operations",
				sections: [
					{ title: "Unions", summary: "Joining sets.", note: "unions" },
					{ title: "Products", summary: "Pairs.", note: "products" },
				],
			},
		],
		sources: [],
	},
};

const notes: NoteStatus[] = [
	{ slug: "products", draft: false },
	{ slug: "membership", draft: false },
	{ slug: "unions", draft: true },
];

const published = courseContents(course, notes, { showDrafts: false });
const developing = courseContents(course, notes, { showDrafts: true });

describe("sectionNumber", () => {
	it("counts parts and sections from 1", () => {
		expect(sectionNumber(0, 0)).toBe("1.1");
		expect(sectionNumber(2, 10)).toBe("3.11");
	});
});

describe("courseContents", () => {
	it("numbers every section by its part and its place in the part", () => {
		expect(published.map((part) => [part.number, part.title])).toEqual([
			[1, "Basics"],
			[2, "Operations"],
		]);
		expect(allSections(published).map((section) => section.number)).toEqual([
			"1.1",
			"1.2",
			"2.1",
			"2.2",
		]);
	});

	it("links a section to the note it names", () => {
		expect(allSections(published).map((section) => section.href)).toEqual([
			"/sets/membership",
			null,
			null,
			"/sets/products",
		]);
	});

	it("shows a section without a note, or with a draft note, as planned on the published site", () => {
		expect(allSections(published).map((section) => section.state)).toEqual([
			"written",
			"planned",
			"planned",
			"written",
		]);
	});

	it("links a draft note and marks it as a draft while developing", () => {
		expect(allSections(developing)[2]).toMatchObject({ state: "draft", href: "/sets/unions" });
		expect(allSections(developing)[1]).toMatchObject({ state: "planned", href: null });
	});

	it("throws every problem of the outline as one OutlineError", () => {
		const unlisted = [...notes, { slug: "powers", draft: false }];
		expect(() => courseContents(course, unlisted, { showDrafts: false })).toThrow(OutlineError);
		expect(() => courseContents(course, unlisted, { showDrafts: false })).toThrow(
			outlineProblems(course, unlisted).join("\n"),
		);
	});
});

describe("readingOrder and notePlace", () => {
	it("read the notes in the order of the outline, not of the files", () => {
		expect(readingOrder(published).map((section) => section.href)).toEqual([
			"/sets/membership",
			"/sets/products",
		]);
		expect(readingOrder(developing).map((section) => section.href)).toEqual([
			"/sets/membership",
			"/sets/unions",
			"/sets/products",
		]);
	});

	it("give a note its number and its neighbours with theirs", () => {
		expect(notePlace(published, "/sets/membership")).toEqual({
			number: "1.1",
			previous: null,
			next: { title: "Products", href: "/sets/products", number: "2.2" },
		});
		expect(notePlace(developing, "/sets/products")).toEqual({
			number: "2.2",
			previous: { title: "Unions", href: "/sets/unions", number: "2.1" },
			next: null,
		});
	});

	it("have no place for a note that no linked section leads to", () => {
		expect(notePlace(published, "/sets/unions")).toBeNull();
		expect(notePlace(published, "/sets/absent")).toBeNull();
	});
});

describe("outlineProblems", () => {
	it("reports a note whose title differs from its section's, ignoring case", () => {
		const titled = (title: string) =>
			outlineProblems(course, [
				{ slug: "membership", draft: false, title },
				...notes.filter((note) => note.slug !== "membership"),
			]);
		const [section] = course.outline.chapters.flatMap((chapter) =>
			chapter.sections.filter((candidate) => candidate.note === "membership"),
		);
		expect(titled(section?.title.toUpperCase() ?? "")).toEqual([]);
		expect(titled("Something else").join("\n")).toMatch(
			/^notes\/sets\/membership\.typ is titled "Something else", but section [\d.]+ of src\/lib\/outlines\/sets\.ts is titled/,
		);
	});

	it("finds none when every published note is named once and every named note exists", () => {
		expect(outlineProblems(course, notes)).toEqual([]);
		expect(outlineProblems(course, [...notes, { slug: "scratch", draft: true }])).toEqual([]);
	});

	it("names the outline file after the course", () => {
		expect(outlineFile("sets")).toBe("src/lib/outlines/sets.ts");
	});

	it("says which note to create or which line to remove when a named note is missing", () => {
		const withoutProducts = notes.filter((note) => note.slug !== "products");
		expect(outlineProblems(course, withoutProducts)).toEqual([
			'src/lib/outlines/sets.ts: section 2.2 "Products" names the note "products", but notes/sets/products.typ does not exist; create it with pnpm run new:note sets products <title>, or remove note: "products" from the section',
		]);
	});

	it("says which line to add when a published note is in no section", () => {
		expect(outlineProblems(course, [...notes, { slug: "powers", draft: false }])).toEqual([
			'notes/sets/powers.typ is published, but no section of src/lib/outlines/sets.ts names it; add note: "powers" to its section there, or add draft: true to the note\'s header',
		]);
	});

	it("refuses a note named by two sections", () => {
		const twice: OutlinedCourse = {
			slug: "sets",
			outline: {
				...course.outline,
				chapters: [
					{
						title: "Basics",
						sections: [
							{ title: "Membership", summary: "", note: "membership" },
							{ title: "Subsets", summary: "", note: "membership" },
						],
					},
				],
			},
		};
		expect(outlineProblems(twice, [{ slug: "membership", draft: false }])).toEqual([
			'src/lib/outlines/sets.ts: sections 1.1 and 1.2 both name the note "membership"; name it in one section only',
		]);
	});
});
