import { noteHref } from "#lib/notes/names.ts";
import type { NoteNeighbours, NoteRef } from "#lib/notes/types.ts";
import {
	type ContentsOptions,
	type ContentsPart,
	courseContents,
	notePlace,
} from "#lib/outlines/contents.ts";
import { courseNoteStatuses, neighboursByOrder } from "#lib/server/typst/notes.ts";
import { type Course, findCourse, outlineHref } from "#lib/site/courses.ts";

export interface NoteNavigation extends NoteNeighbours {
	course: { title: string; href: string } | null;
	number: string | null;
}

export interface CourseOverview {
	slug: string;
	title: string;
	description: string;
	href: string;
	parts: ContentsPart[];
}

export async function loadCourseContents(
	course: Course,
	options: ContentsOptions,
): Promise<ContentsPart[]> {
	return courseContents(course, await courseNoteStatuses(course.slug), options);
}

export async function courseOverview(
	course: Course,
	options: ContentsOptions,
): Promise<CourseOverview> {
	return {
		slug: course.slug,
		title: course.outline.title,
		description: course.outline.description,
		href: outlineHref(course),
		parts: await loadCourseContents(course, options),
	};
}

export async function noteNavigation(
	ref: NoteRef,
	options: ContentsOptions,
): Promise<NoteNavigation> {
	const course = findCourse(ref.course);
	if (!course) return { course: null, number: null, ...(await neighboursByOrder(ref)) };
	const place = notePlace(await loadCourseContents(course, options), noteHref(ref));
	return {
		course: { title: course.outline.title, href: outlineHref(course) },
		...(place ?? { number: null, previous: null, next: null }),
	};
}
