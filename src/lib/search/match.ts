import type { SearchEntry } from "./types";

const fold = (text: string): string =>
	text
		.normalize("NFKD")
		.replace(/\p{M}+/gu, "")
		.toLowerCase();

const words = (query: string): string[] => fold(query).split(/\s+/).filter(Boolean);

/** Lower is better; undefined when some word of the query appears nowhere in the entry. */
function score(entry: SearchEntry, query: string[]): number | undefined {
	const label = fold(entry.label);
	const context = fold(entry.context);
	if (!query.every((word) => label.includes(word) || context.includes(word))) return undefined;
	const inLabel = query.filter((word) => label.includes(word)).length;
	const startsLabel = label.startsWith(query[0] ?? "") ? 0 : 1;
	return (query.length - inLabel) * 10 + startsLabel;
}

export interface SearchResults {
	/** The best matches, at most `limit` of them. */
	shown: SearchEntry[];
	/** How many entries matched in all. */
	total: number;
}

/** The entries that contain every word of the query, best first, keeping their order among equals. */
export function search(entries: readonly SearchEntry[], query: string, limit = 12): SearchResults {
	const wanted = words(query);
	if (wanted.length === 0) return { shown: [], total: 0 };
	const matches = entries
		.flatMap((entry) => {
			const rank = score(entry, wanted);
			return rank === undefined ? [] : [{ entry, rank }];
		})
		.sort((a, b) => a.rank - b.rank);
	return { shown: matches.slice(0, limit).map(({ entry }) => entry), total: matches.length };
}
