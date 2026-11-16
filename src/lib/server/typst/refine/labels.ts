import type { NoteCard, NoteHeading } from "#lib/notes/types.ts";
import { idFrom } from "./anchors";
import { slug } from "./headings";

/**
 * What is wrong with the labels an author gave the cards of a note, one line each. A label
 * is a card's address, so it must be the only one, and must not take the address a section
 * heading or a numbered card would otherwise have: links to those would land on the card.
 */
export function labelProblems(
	labels: readonly string[],
	headings: readonly NoteHeading[],
	cards: readonly NoteCard[],
): string[] {
	const used = new Set(labels);
	const repeated = [...new Set(labels.filter((label, index) => labels.indexOf(label) !== index))];
	return [
		...repeated.map((label) => `two cards have the label <${label}>; give each card its own label`),
		...headings
			.filter((heading) => used.has(slug(heading.text)))
			.map(
				(heading) =>
					`the label <${slug(heading.text)}> is also the address of the section "${heading.text}"; rename the label`,
			),
		...cards
			.filter((card) => !card.labelled && used.has(idFrom(card.name)))
			.map(
				(card) =>
					`the label <${idFrom(card.name)}> is the address ${card.name} gets on its own; rename the label`,
			),
	];
}
