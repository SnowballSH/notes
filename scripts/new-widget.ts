import { mkdir, writeFile } from "node:fs/promises";
import { alreadyExists, runCommand, UsageError } from "./scaffold/cli.ts";
import { widgetNameProblem, widgetScaffold } from "./scaffold/widget.ts";

await runCommand(async () => {
	const [name, ...extra] = process.argv.slice(2);
	const problem =
		extra.length > 0
			? `a widget has one name: did you mean ${[name, ...extra].join("-")}?`
			: widgetNameProblem(name);
	if (name === undefined || problem !== undefined) {
		throw new UsageError(`${problem}\nUsage: pnpm run new:widget <name>`);
	}
	const { directory, files, usage } = widgetScaffold(name);
	await mkdir(directory).catch((cause: unknown) => {
		throw alreadyExists(cause) ? new UsageError(`${directory} already exists`) : cause;
	});
	for (const { path, content } of files) {
		await writeFile(path, content, { flag: "wx" });
		console.log(`Created ${path}`);
	}
	console.log(`
Put it in a note with:
  ${usage}
Try it with pnpm run dev at:
  http://localhost:5173/dev/widgets#${name}`);
});
