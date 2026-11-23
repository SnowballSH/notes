const indexHref = "/search.json";

const noteAddress = (entry: unknown): string[] =>
	typeof entry === "object" &&
	entry !== null &&
	"kind" in entry &&
	entry.kind === "note" &&
	"href" in entry &&
	typeof entry.href === "string"
		? [entry.href]
		: [];

export const publishedNotes = (index: unknown): ReadonlySet<string> =>
	new Set(Array.isArray(index) ? index.flatMap(noteAddress) : []);

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
