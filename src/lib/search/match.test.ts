import { describe, expect, it } from "vitest";
import { search } from "./match";
import type { SearchEntry } from "./types";

const entry = (label: string, context = "Boolean functions"): SearchEntry => ({
	label,
	context,
	href: `#${label}`,
	kind: "card",
});

const entries = [
	entry("Theorem 1: Fourier Expansion"),
	entry("Definition 2: Parity Function"),
	entry("Theorem 3: Plancherel and Parseval"),
	entry("Proposition 4: Naïve Method", "The Walsh-Hadamard transform"),
];

const labels = (query: string): string[] =>
	search(entries, query).shown.map((found) => found.label);

describe("search", () => {
	it("finds entries that contain every word, in any order and case", () => {
		expect(labels("parseval THEOREM")).toEqual(["Theorem 3: Plancherel and Parseval"]);
	});

	it("matches a word in the context, after matches in the label", () => {
		expect(labels("boolean theorem")).toEqual([
			"Theorem 1: Fourier Expansion",
			"Theorem 3: Plancherel and Parseval",
		]);
		expect(labels("walsh")).toEqual(["Proposition 4: Naïve Method"]);
	});

	it("ignores accents", () => {
		expect(labels("naive")).toEqual(["Proposition 4: Naïve Method"]);
	});

	it("puts a label that starts with the query first", () => {
		expect(labels("par")[0]).toBe("Definition 2: Parity Function");
		expect(search([entry("A parity"), entry("Parity")], "parity").shown[0]?.label).toBe("Parity");
	});

	it("returns nothing for an empty query or no match", () => {
		expect(labels("  ")).toEqual([]);
		expect(labels("quantum")).toEqual([]);
	});

	it("keeps to the limit", () => {
		const { shown, total } = search(entries, "o", 2);
		expect(shown).toHaveLength(2);
		expect(total).toBe(4);
	});
});
