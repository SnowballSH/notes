import { describe, expect, it } from "vitest";
import { sectionNumber } from "../../outlines/contents";
import { walshHadamard } from "../../outlines/walsh-hadamard";
import { dependencies, destination } from "./dependencies";

const outlineNumbers = walshHadamard.chapters.flatMap((chapter, partIndex) =>
	chapter.sections.map((_, sectionIndex) => sectionNumber(partIndex, sectionIndex)),
);

describe("the dependencies of the roadmap", () => {
	it("names only sections of the outline", () => {
		const named = [...Object.keys(dependencies), ...Object.values(dependencies).flat()];
		expect(named.filter((number) => !outlineNumbers.includes(number))).toEqual([]);
	});

	it("covers every section but the overview", () => {
		expect(Object.keys(dependencies).toSorted()).toEqual(
			outlineNumbers.filter((number) => number !== "1.1"),
		);
	});

	it("lets a section need only earlier ones", () => {
		const late = Object.entries(dependencies).flatMap(([number, needs]) =>
			needs.filter((need) => outlineNumbers.indexOf(need) >= outlineNumbers.indexOf(number)),
		);
		expect(late).toEqual([]);
	});

	it("ends at the last section, which nothing else needs", () => {
		expect(destination).toBe(outlineNumbers.at(-1));
		expect(Object.values(dependencies).flat()).not.toContain(destination);
	});
});
