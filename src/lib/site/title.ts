export const siteName = "Notes";

/** Where the site is published, for the addresses search engines and shared links are given. */
export const siteOrigin = "https://notes.snowballsh.com";

/**
 * A document title that names the page first and the site last. A part that repeats the
 * one before it, as when a note is named after its course, is left out.
 */
export function pageTitle(...parts: string[]): string {
	const distinct = [...parts, siteName].filter(
		(part, index, all) => part.toLowerCase() !== all[index - 1]?.toLowerCase(),
	);
	return distinct.join(" \u00b7 ");
}
