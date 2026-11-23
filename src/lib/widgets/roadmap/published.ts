/** The search index of the built site: it has one entry of kind "note" for each published note. */
export const indexHref = "/search.json";

const noteAddress = (entry: unknown): string[] =>
	typeof entry === "object" &&
	entry !== null &&
	"kind" in entry &&
	entry.kind === "note" &&
	"href" in entry &&
	typeof entry.href === "string"
		? [entry.href]
		: [];

/** The addresses of the published notes that a parsed search index lists. */
export const publishedNotes = (index: unknown): ReadonlySet<string> =>
	new Set(Array.isArray(index) ? index.flatMap(noteAddress) : []);

/** The published notes of the site, or none when the index cannot be loaded or read. */
export async function loadPublishedNotes(
	load: (address: string) => Promise<Response>,
): Promise<ReadonlySet<string>> {
	try {
		const response = await load(indexHref);
		return response.ok ? publishedNotes(await response.json()) : new Set();
	} catch {
		return new Set();
	}
}
