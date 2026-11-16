import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { alreadyExists, runCommand, UsageError } from "./scaffold/cli.ts";
import { nextOrder, notePath, noteRequestProblem, noteSource } from "./scaffold/note.ts";

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
	const path = notePath({ course, slug });
	const directory = dirname(path);
	const startsCourse = (await mkdir(directory, { recursive: true })) !== undefined;
	const order = nextOrder(await courseSources(directory));
	await writeFile(path, noteSource(title, order), { flag: "wx" }).catch((cause: unknown) => {
		throw alreadyExists(cause) ? new UsageError(`${path} already exists`) : cause;
	});
	console.log(`Created ${path} with order ${order}`);
	if (startsCourse) console.log(`It starts a new course in ${directory}.`);
	console.log(`
Read it with pnpm run dev at:
  http://localhost:5173/${course}/${slug}
If the course has an outline in src/lib/outlines, link the note from it.`);
});
