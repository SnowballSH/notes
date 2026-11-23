import { describe, expect, it } from "vitest";
import { loadPublishedNotes, publishedNotes } from "./published";

const index = [
	{
		label: "Boolean functions and Fourier expansions",
		context: "The Walsh-Hadamard Transform",
		href: "/walsh-hadamard/boolean-functions",
		kind: "note",
	},
	{
		label: "Parity functions",
		context: "Boolean functions and Fourier expansions",
		href: "/walsh-hadamard/boolean-functions#parity-functions",
		kind: "section",
	},
	{
		label: "Theorem 1",
		context: "Qubits",
		href: "/walsh-hadamard/qubits#theorem-1",
		kind: "card",
	},
	{ label: "Qubits", context: "Course", href: "/walsh-hadamard/qubits", kind: "note" },
];

describe("the published notes in a search index", () => {
	it("are the addresses of its note entries", () => {
		expect([...publishedNotes(index)]).toEqual([
			"/walsh-hadamard/boolean-functions",
			"/walsh-hadamard/qubits",
		]);
	});

	it("are none when the index is not a list of entries", () => {
		expect(publishedNotes(null).size).toBe(0);
		expect(publishedNotes({ kind: "note", href: "/a/b" }).size).toBe(0);
		expect(publishedNotes([null, "note", { kind: "note" }, { kind: "note", href: 3 }]).size).toBe(
			0,
		);
	});
});

describe("loading the published notes", () => {
	it("asks for the search index once and reads it", async () => {
		const asked: string[] = [];
		const found = await loadPublishedNotes(async (address) => {
			asked.push(address);
			return Response.json(index);
		});
		expect(asked).toEqual(["/search.json"]);
		expect(found.has("/walsh-hadamard/qubits")).toBe(true);
		expect(found.has("/walsh-hadamard/oracles")).toBe(false);
	});

	it("finds none when the request fails", async () => {
		const found = await loadPublishedNotes(async () => {
			throw new TypeError("offline");
		});
		expect(found.size).toBe(0);
	});

	it("finds none when the answer is an error page or not JSON", async () => {
		const missing = await loadPublishedNotes(async () => Response.json(index, { status: 404 }));
		const broken = await loadPublishedNotes(async () => new Response("<html>"));
		expect(missing.size).toBe(0);
		expect(broken.size).toBe(0);
	});
});
