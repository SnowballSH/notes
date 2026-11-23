import { parseFragment, serialize } from "parse5";
import type { NoteCard, NoteHeading } from "#lib/notes/types.ts";
import { Addresses } from "./addresses";
import { addAnchors, adoptLabels } from "./anchors";
import { classifyCodeTokens } from "./code";
import { attribute, descendants } from "./dom";
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
	problems: string[];
}

export function refineNoteHtml(html: string): RefinedNote {
	const fragment = parseFragment(html);
	refineMath(fragment);
	keepMathWithAttachedText(fragment);
	reserveWidgetSpace(fragment);
	classifyCodeTokens(fragment);
	describeImages(fragment);
	const labels = adoptLabels(fragment);
	const ids = descendants(fragment).flatMap((element) => attribute(element, "id") ?? []);
	const addresses = new Addresses(ids, labels);
	const headings = identifyHeadings(fragment, addresses);
	const cards = addAnchors(fragment, addresses);
	const problems = labelProblems(labels, addresses.displacements);
	return { html: serialize(fragment), headings, cards, problems };
}
