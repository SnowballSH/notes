import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const TYPST_VERSION = "0.15.1";

const run = promisify(execFile);
const maxBuffer = 64 * 1024 * 1024;

export class TypstError extends Error {}

interface TypstOutput<Stdout = string> {
	stdout: Stdout;
	warnings: string[];
}

const exportIsExperimental = /^warning: html export is under active development/;

function diagnostics(stderr: string): string[] {
	return stderr
		.split(/^(?=(?:warning|error): )/m)
		.map((block) => block.trim())
		.filter((block) => block !== "" && !exportIsExperimental.test(block));
}

export const parseWarnings = (stderr: string): string[] =>
	diagnostics(stderr).filter((block) => block.startsWith("warning: "));

async function typstBytes(args: string[]): Promise<TypstOutput<Buffer>> {
	try {
		const { stdout, stderr } = await run("typst", args, { maxBuffer, encoding: "buffer" });
		return { stdout, warnings: parseWarnings(stderr.toString()) };
	} catch (cause) {
		const { stderr } = cause as { stderr?: Buffer };
		const detail =
			stderr === undefined ? String(cause) : diagnostics(stderr.toString()).join("\n\n");
		throw new TypstError(`typst ${args[0]} failed:\n${detail}`, { cause });
	}
}

async function typst(args: string[]): Promise<TypstOutput> {
	const { stdout, warnings } = await typstBytes(args);
	return { stdout: stdout.toString(), warnings };
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

export async function compilePdf(
	root: string,
	file: string,
	inputs: Readonly<Record<string, string>>,
): Promise<TypstOutput<Uint8Array<ArrayBuffer>>> {
	await assertVersion();
	const { stdout, warnings } = await typstBytes([
		"compile",
		"--format",
		"pdf",
		// Only Typst's bundled fonts, so that every machine sets the same pages.
		"--ignore-system-fonts",
		"--root",
		root,
		...Object.entries(inputs).flatMap(([name, value]) => ["--input", `${name}=${value}`]),
		file,
		"-",
	]);
	return { stdout: new Uint8Array(stdout), warnings };
}

export async function readMetadata(root: string, file: string, label: string): Promise<unknown[]> {
	await assertVersion();
	const expression = `query(<${label}>).map(found => found.value)`;
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
