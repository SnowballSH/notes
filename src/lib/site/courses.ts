import type { NotesOutline } from "#lib/outlines/types.ts";
import { walshHadamard } from "#lib/outlines/walsh-hadamard.ts";
import { type Category, categories } from "./categories.ts";

export interface Course {
	slug: string;
	category: Category;
	outline: NotesOutline;
}

export const courses: readonly Course[] = [
	{ slug: "walsh-hadamard", category: categories.specialTopics, outline: walshHadamard },
];

export const outlineHref = ({ category, slug }: Pick<Course, "category" | "slug">): string =>
	`/${category.slug}/${slug}`;

export const findCourse = (slug: string): Course | undefined =>
	courses.find((course) => course.slug === slug);

export const findCourseAt = (categorySlug: string, slug: string): Course | undefined =>
	courses.find((course) => course.category.slug === categorySlug && course.slug === slug);

export const coursesByCategory: readonly (readonly [Category, Course[]])[] = [
	...new Set(courses.map((course) => course.category)),
].map((category) => [category, courses.filter((course) => course.category === category)]);
