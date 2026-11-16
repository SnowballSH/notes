/** `text` as a string literal in Typst source. */
export const typstString = (text: string): string =>
	`"${text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n")}"`;
