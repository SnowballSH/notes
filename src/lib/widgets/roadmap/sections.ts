import { noteHref } from "../../notes/names.ts";
import { sectionNumber } from "../../outlines/contents.ts";
import type { NotesOutline } from "../../outlines/types.ts";

const course = "walsh-hadamard";

export interface RoadmapSection {
	number: string;
	title: string;
	href: string | null;
	needs: readonly string[];
}

export const roadmapSections = (
	outline: NotesOutline,
	needs: Readonly<Record<string, readonly string[]>>,
): RoadmapSection[] =>
	outline.chapters.flatMap((chapter, partIndex) =>
		chapter.sections.flatMap(({ title, note }, sectionIndex) => {
			const number = sectionNumber(partIndex, sectionIndex);
			const needed = needs[number];
			if (needed === undefined) return [];
			return {
				number,
				title,
				href: note === undefined ? null : noteHref({ course, slug: note }),
				needs: needed,
			};
		}),
	);

const listed = (numbers: readonly string[]): string =>
	numbers.length <= 1
		? numbers.join("")
		: `${numbers.slice(0, -1).join(", ")} and ${numbers.at(-1)}`;

export const needsText = (needs: readonly string[]): string =>
	needs.length === 0 ? "" : `, needs ${listed(needs)}`;
