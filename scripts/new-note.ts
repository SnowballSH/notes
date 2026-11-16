import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { outlineFile } from "../src/lib/outlines/contents.ts";
import { isCategorySlug } from "../src/lib/site/categories.ts";
import { findCourse } from "../src/lib/site/courses.ts";
import { alreadyExists, runCommand, UsageError } from "./scaffold/cli.ts";
import {
	type NotePlacement,
	nextOrder,
	noteNextSteps,
	notePath,
	noteRequestProblem,
	noteSource,
	unknownCourseProblem,
} from "./scaffold/note.ts";

async function courseSources(directory: string): Promise<string[]> {
	const files = (await readdir(directory)).filter((file) => file.endsWith(".typ"));
	return Promise.all(files.map((file) => readFile(join(directory, file), "utf8")));
}

await runCommand(async () => {
	const args = process.argv.slice(2);
	const startsCourse = args.includes("--new-course");
	const [course, slug, ...words] = args.filter((argument) => argument !== "--new-course");
	const title = words.join(" ");
	const problem = noteRequestProblem(course, slug, title);
	if (course === undefined || slug === undefined || problem !== undefined) {
		throw new UsageError(
			`${problem}\nUsage: pnpm run new:note [--new-course] <course> <slug> <title...>`,
		);
	}
	const request = { course, slug, title };
	const path = notePath(request);
	const directory = dirname(path);
	if (isCategorySlug(course)) {
		throw new UsageError(`"${course}" is the address of a category, so it cannot name a course`);
	}
	const exists = await stat(directory).then(
		() => true,
		() => false,
	);
	if (!exists && !findCourse(course) && !startsCourse) {
		const known = (await readdir("notes", { withFileTypes: true }))
			.filter((entry) => entry.isDirectory() && entry.name !== "lib")
			.map((entry) => entry.name);
		throw new UsageError(unknownCourseProblem(course, known));
	}
	await mkdir(directory, { recursive: true });
	const placement: NotePlacement = findCourse(course)
		? { outline: outlineFile(course) }
		: { order: nextOrder(await courseSources(directory)) };
	await writeFile(path, noteSource(title, placement), { flag: "wx" }).catch((cause: unknown) => {
		throw alreadyExists(cause) ? new UsageError(`${path} already exists`) : cause;
	});
	console.log(noteNextSteps(request, placement));
});
