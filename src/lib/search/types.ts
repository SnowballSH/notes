export interface SearchEntry {
	label: string;
	context: string;
	href: string;
	kind: "note" | "section" | "card";
}
