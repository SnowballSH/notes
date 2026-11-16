import { parseFragment, serialize } from "parse5";
import type { NoteHeading } from "#lib/notes/types.ts";
import { identifyHeadings } from "./headings";
import { refineMath } from "./math";
import { keepMathWithAttachedText } from "./prose";
import { reserveWidgetSpace } from "./widgets";

export interface RefinedNote {
	html: string;
	headings: NoteHeading[];
}

/** Repairs the parts of Typst's HTML export that browsers render badly. See docs/notes-system.md. */
export function refineNoteHtml(html: string): RefinedNote {
	const fragment = parseFragment(html);
	refineMath(fragment);
	keepMathWithAttachedText(fragment);
	reserveWidgetSpace(fragment);
	const headings = identifyHeadings(fragment);
	return { html: serialize(fragment), headings };
}
