import { describe, expect, it } from "vitest";
import { parseWarnings } from "./cli";

const standing = `warning: html export is under active development and incomplete
 = hint: its behaviour may change at any time
 = hint: do not rely on this feature for production use cases
`;

describe("parseWarnings", () => {
	it("ignores the standing warning about HTML export", () => {
		expect(parseWarnings(standing)).toEqual([]);
	});

	it("keeps each other warning with the place it points at", () => {
		const ignored = `warning: line was ignored during HTML export
   ┌─ notes/a/b.typ:60:1
   │
60 │ #line(length: 100%)`;
		expect(parseWarnings(`${standing}\n${ignored}\n\nwarning: second\n`)).toEqual([
			ignored,
			"warning: second",
		]);
	});
});
