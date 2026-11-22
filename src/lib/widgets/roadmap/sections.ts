import { noteHref } from "../../notes/names.ts";
import { sectionNumber } from "../../outlines/contents.ts";
import type { NotesOutline } from "../../outlines/types.ts";

export const course = "walsh-hadamard";

export interface RoadmapSection {
	number: string;
	title: string;
	/** The address of the section's note, whether or not it is published; null without a note. */
	href: string | null;
	needs: readonly string[];
}

/** The sections that have an entry in `needs`, in the order of the outline. */
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

/** What a screen reader hears after a section's title; empty for a section that needs nothing. */
export const needsText = (needs: readonly string[]): string =>
	needs.length === 0 ? "" : `, needs ${listed(needs)}`;
