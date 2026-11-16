import { error } from "@sveltejs/kit";
import { courseOverview } from "#lib/server/site/courses.ts";
import { courses, findCourseAt } from "#lib/site/courses.ts";
import { dev } from "$app/env";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const entries: EntryGenerator = () =>
	courses.map((course) => ({ category: course.category.slug, course: course.slug }));

export const load: PageServerLoad = async ({ params }) => {
	const course = findCourseAt(params.category, params.course);
	if (!course) error(404, "Not Found");
	return {
		course: await courseOverview(course, { showDrafts: dev }),
		category: course.category.title,
		sources: course.outline.sources,
	};
};
