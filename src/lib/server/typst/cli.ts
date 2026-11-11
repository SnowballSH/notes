import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const TYPST_VERSION = "0.15.1";

const run = promisify(execFile);
const maxBuffer = 64 * 1024 * 1024;

export class TypstError extends Error {}

async function typst(args: string[]): Promise<string> {
	try {
		const { stdout } = await run("typst", args, { maxBuffer });
		return stdout;
	} catch (cause) {
		const detail = (cause as { stderr?: string }).stderr ?? String(cause);
		throw new TypstError(`typst ${args[0]} failed:\n${detail}`, { cause });
	}
}

let versionChecked: Promise<void> | undefined;

function assertVersion(): Promise<void> {
	versionChecked ??= typst(["--version"])
		.then((output) => {
			const found = output.split(" ")[1];
			if (found !== TYPST_VERSION) {
				throw new TypstError(`typst ${TYPST_VERSION} is required, found ${found}`);
			}
		})
		.catch((cause) => {
			versionChecked = undefined;
			throw cause;
		});
	return versionChecked;
}

export async function compileHtml(root: string, file: string): Promise<string> {
	await assertVersion();
	return typst(["compile", "--features", "html", "--format", "html", "--root", root, file, "-"]);
}

export async function queryOne(root: string, file: string, selector: string): Promise<unknown> {
	await assertVersion();
	const output = await typst([
		"query",
		"--features",
		"html",
		"--target",
		"html",
		"--root",
		root,
		file,
		selector,
		"--field",
		"value",
		"--one",
	]);
	return JSON.parse(output);
}
