import type { NotesOutline } from "#lib/outlines/types.ts";
import { walshHadamard } from "#lib/outlines/walsh-hadamard.ts";
import { type Category, categories } from "./categories.ts";

export interface Course {
	/** The directory of the course's notes under `notes/`, and the first segment of their URLs. */
	slug: string;
	category: Category;
	outline: NotesOutline;
}

export const courses: readonly Course[] = [
	{ slug: "walsh-hadamard", category: categories.specialTopics, outline: walshHadamard },
];

/** The page that introduces a course and lists its notes. */
export const outlineHref = ({ category, slug }: Pick<Course, "category" | "slug">): string =>
	`/${category.slug}/${slug}`;

export const findCourse = (slug: string): Course | undefined =>
	courses.find((course) => course.slug === slug);

export const findCourseAt = (categorySlug: string, slug: string): Course | undefined =>
	courses.find((course) => course.category.slug === categorySlug && course.slug === slug);

/** The courses under each category, with categories in the order they first appear. */
export const coursesByCategory: readonly (readonly [Category, Course[]])[] = [
	...new Set(courses.map((course) => course.category)),
].map((category) => [category, courses.filter((course) => course.category === category)]);
