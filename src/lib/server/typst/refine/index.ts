import { parseFragment, serialize } from "parse5";
import type { NoteCard, NoteHeading } from "#lib/notes/types.ts";
import { addAnchors, adoptLabels } from "./anchors";
import { classifyCodeTokens } from "./code";
import { identifyHeadings } from "./headings";
import { describeImages } from "./images";
import { labelProblems } from "./labels";
import { refineMath } from "./math";
import { keepMathWithAttachedText } from "./prose";
import { reserveWidgetSpace } from "./widgets";

export interface RefinedNote {
	html: string;
	headings: NoteHeading[];
	cards: NoteCard[];
	/** What the author must fix in the note's labels; see `labelProblems`. */
	problems: string[];
}

/** Repairs the parts of Typst's HTML export that browsers render badly. See docs/notes-system.md. */
export function refineNoteHtml(html: string): RefinedNote {
	const fragment = parseFragment(html);
	refineMath(fragment);
	keepMathWithAttachedText(fragment);
	reserveWidgetSpace(fragment);
	classifyCodeTokens(fragment);
	describeImages(fragment);
	const labels = adoptLabels(fragment);
	const headings = identifyHeadings(fragment);
	const cards = addAnchors(fragment);
	const problems = labelProblems(labels, headings, cards);
	return { html: serialize(fragment), headings, cards, problems };
}
