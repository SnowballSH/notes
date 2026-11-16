import { describe, expect, it } from "vitest";
import { parseSavedBlocks } from "./blocks";

describe("parseSavedBlocks", () => {
	it("reads what was saved", () => {
		expect(parseSavedBlocks('{"open":[true,false],"scroll":120}')).toEqual({
			open: [true, false],
			scroll: 120,
		});
	});

	it.each([null, "", "not json", "[]", '{"open":[1],"scroll":0}', '{"open":[true]}'])(
		"ignores %j",
		(text) => {
			expect(parseSavedBlocks(text)).toBeUndefined();
		},
	);
});
