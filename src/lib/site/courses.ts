import type { NotesOutline } from "#lib/outlines/types.ts";
import { walshHadamard } from "#lib/outlines/walsh-hadamard.ts";

export interface Course {
	/** The directory of the course's notes under `notes/`, and the first segment of their URLs. */
	slug: string;
	category: string;
	/** The page that introduces the course and lists its notes. */
	href: string;
	outline: NotesOutline;
}

export const courses: readonly Course[] = [
	{
		slug: "walsh-hadamard",
		category: "Special topics",
		href: "/special-topics/walsh-hadamard",
		outline: walshHadamard,
	},
];

export const findCourse = (slug: string): Course | undefined =>
	courses.find((course) => course.slug === slug);

export function requireCourse(slug: string): Course {
	const course = findCourse(slug);
	if (!course) throw new Error(`no course is registered as ${slug}`);
	return course;
}

/** The courses under each category, with categories in the order they first appear. */
export const coursesByCategory: readonly (readonly [string, Course[]])[] = [
	...new Set(courses.map((course) => course.category)),
].map((category) => [category, courses.filter((course) => course.category === category)]);
