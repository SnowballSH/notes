export const siteName = "Notes";

export const siteOrigin = "https://notes.snowballsh.com";

export function pageTitle(...parts: string[]): string {
	const distinct = [...parts, siteName].filter(
		(part, index, all) => part.toLowerCase() !== all[index - 1]?.toLowerCase(),
	);
	return distinct.join(" \u00b7 ");
}
