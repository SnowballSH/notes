import type { SearchEntry } from "./types";

const fold = (text: string): string =>
	text
		.normalize("NFKD")
		.replace(/\p{M}+/gu, "")
		.toLowerCase();

const words = (query: string): string[] => fold(query).split(/\s+/).filter(Boolean);

function score(entry: SearchEntry, query: string[]): number | undefined {
	const label = fold(entry.label);
	const context = fold(entry.context);
	if (!query.every((word) => label.includes(word) || context.includes(word))) return undefined;
	const inLabel = query.filter((word) => label.includes(word)).length;
	const startsLabel = label.startsWith(query[0] ?? "") ? 0 : 1;
	return (query.length - inLabel) * 10 + startsLabel;
}

export interface SearchResults {
	shown: SearchEntry[];
	total: number;
}

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
