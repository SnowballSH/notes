export const typstString = (text: string): string =>
	`"${text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n")}"`;
