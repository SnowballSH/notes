import { courseOverview } from "#lib/server/site/courses.ts";
import { coursesByCategory } from "#lib/site/courses.ts";
import { dev } from "$app/env";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
	categories: await Promise.all(
		coursesByCategory.map(async ([category, listed]) => ({
			title: category.title,
			courses: await Promise.all(
				listed.map((course) => courseOverview(course, { showDrafts: dev })),
			),
		})),
	),
});
