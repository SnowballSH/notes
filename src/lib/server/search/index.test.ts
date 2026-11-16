import { describe, expect, it } from "vitest";
import type { CompiledNote } from "#lib/notes/types.ts";
import { entriesOf } from "./index";

const note: CompiledNote = {
	course: "sets",
	slug: "unions",
	meta: { title: "Unions", summary: null, order: 1, draft: false },
	html: "",
	styles: "",
	warnings: [],
	headings: [{ id: "basics", text: "Basics", level: 2 }],
	cards: [
		{ id: "thm-union", name: "Theorem 1", title: "Union Bound" },
		{ id: "remark-1", name: "Remark 1", title: "" },
	],
};

describe("entriesOf", () => {
	it("lists the note, its sections and its cards, each with its address", () => {
		expect(entriesOf(note, "Sets")).toEqual([
			{ label: "Unions", context: "Sets", href: "/sets/unions", kind: "note" },
			{ label: "Basics", context: "Unions", href: "/sets/unions#basics", kind: "section" },
			{
				label: "Theorem 1: Union Bound",
				context: "Unions",
				href: "/sets/unions#thm-union",
				kind: "card",
			},
			{ label: "Remark 1", context: "Unions", href: "/sets/unions#remark-1", kind: "card" },
		]);
	});
});
