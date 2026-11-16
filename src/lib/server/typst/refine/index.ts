import { parseFragment, serialize } from "parse5";
import { refineMath } from "./math";
import { keepMathWithAttachedText } from "./prose";

/** Repairs the parts of Typst's HTML export that browsers render badly. See docs/notes-system.md. */
export function refineNoteHtml(html: string): string {
	const fragment = parseFragment(html);
	refineMath(fragment);
	keepMathWithAttachedText(fragment);
	return serialize(fragment);
}
