import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const TYPST_VERSION = "0.15.1";

const run = promisify(execFile);
const maxBuffer = 64 * 1024 * 1024;

export class TypstError extends Error {}

interface TypstOutput {
	stdout: string;
	/** Typst's diagnostics for a run that succeeded, each with the place it points at. */
	warnings: string[];
}

const exportIsExperimental = /^warning: html export is under active development/;

/** Typst's diagnostics, one string each, without the standing warning about HTML export. */
function diagnostics(stderr: string): string[] {
	return stderr
		.split(/^(?=(?:warning|error): )/m)
		.map((block) => block.trim())
		.filter((block) => block !== "" && !exportIsExperimental.test(block));
}

export const parseWarnings = (stderr: string): string[] =>
	diagnostics(stderr).filter((block) => block.startsWith("warning: "));

async function typst(args: string[]): Promise<TypstOutput> {
	try {
		const { stdout, stderr } = await run("typst", args, { maxBuffer });
		return { stdout, warnings: parseWarnings(stderr) };
	} catch (cause) {
		const { stderr } = cause as { stderr?: string };
		const detail = stderr === undefined ? String(cause) : diagnostics(stderr).join("\n\n");
		throw new TypstError(`typst ${args[0]} failed:\n${detail}`, { cause });
	}
}

let versionChecked: Promise<void> | undefined;

function assertVersion(): Promise<void> {
	versionChecked ??= typst(["--version"])
		.then(({ stdout }) => {
			const found = stdout.split(" ")[1];
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

export async function compileHtml(root: string, file: string): Promise<TypstOutput> {
	await assertVersion();
	return typst(["compile", "--features", "html", "--format", "html", "--root", root, file, "-"]);
}

/** The value of the first metadata element with the given label, or null when the file has none. */
export async function readMetadata(root: string, file: string, label: string): Promise<unknown> {
	await assertVersion();
	const expression = `query(<${label}>).map(found => found.value).at(0, default: none)`;
	const { stdout } = await typst([
		"eval",
		expression,
		"--in",
		file,
		"--features",
		"html",
		"--target",
		"html",
		"--root",
		root,
	]);
	return JSON.parse(stdout);
}
