export interface Category {
	slug: string;
	title: string;
}

export const categories = {
	specialTopics: { slug: "special-topics", title: "Special topics" },
} as const satisfies Record<string, Category>;

export const isCategorySlug = (slug: string): boolean =>
	Object.values(categories).some((category) => category.slug === slug);
