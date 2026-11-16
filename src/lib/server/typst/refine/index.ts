import { parseFragment, serialize } from "parse5";
import type { NoteCard, NoteHeading } from "#lib/notes/types.ts";
import { addAnchors, adoptLabels } from "./anchors";
import { classifyCodeTokens } from "./code";
import { identifyHeadings } from "./headings";
import { describeImages } from "./images";
import { refineMath } from "./math";
import { keepMathWithAttachedText } from "./prose";
import { reserveWidgetSpace } from "./widgets";

export interface RefinedNote {
	html: string;
	headings: NoteHeading[];
	cards: NoteCard[];
}

/** Repairs the parts of Typst's HTML export that browsers render badly. See docs/notes-system.md. */
export function refineNoteHtml(html: string): RefinedNote {
	const fragment = parseFragment(html);
	refineMath(fragment);
	keepMathWithAttachedText(fragment);
	reserveWidgetSpace(fragment);
	classifyCodeTokens(fragment);
	describeImages(fragment);
	adoptLabels(fragment);
	const headings = identifyHeadings(fragment);
	const cards = addAnchors(fragment);
	return { html: serialize(fragment), headings, cards };
}
