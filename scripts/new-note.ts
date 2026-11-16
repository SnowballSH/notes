import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { outlineFile } from "../src/lib/outlines/contents.ts";
import { findCourse } from "../src/lib/site/courses.ts";
import { alreadyExists, runCommand, UsageError } from "./scaffold/cli.ts";
import {
	type NotePlacement,
	nextOrder,
	noteNextSteps,
	notePath,
	noteRequestProblem,
	noteSource,
} from "./scaffold/note.ts";

async function courseSources(directory: string): Promise<string[]> {
	const files = (await readdir(directory)).filter((file) => file.endsWith(".typ"));
	return Promise.all(files.map((file) => readFile(join(directory, file), "utf8")));
}

await runCommand(async () => {
	const [course, slug, ...words] = process.argv.slice(2);
	const title = words.join(" ");
	const problem = noteRequestProblem(course, slug, title);
	if (course === undefined || slug === undefined || problem !== undefined) {
		throw new UsageError(`${problem}\nUsage: pnpm run new:note <course> <slug> <title...>`);
	}
	const request = { course, slug, title };
	const path = notePath(request);
	const directory = dirname(path);
	await mkdir(directory, { recursive: true });
	const placement: NotePlacement = findCourse(course)
		? { outline: outlineFile(course) }
		: { order: nextOrder(await courseSources(directory)) };
	await writeFile(path, noteSource(title, placement), { flag: "wx" }).catch((cause: unknown) => {
		throw alreadyExists(cause) ? new UsageError(`${path} already exists`) : cause;
	});
	console.log(noteNextSteps(request, placement));
});
