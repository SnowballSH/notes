import type { Page } from "@playwright/test";

export const chapter = {
	first: "/walsh-hadamard/boolean-functions",
	second: "/walsh-hadamard/walsh-hadamard",
} as const;

export const pages = [
	"/",
	"/special-topics/walsh-hadamard",
	chapter.first,
	chapter.second,
] as const;

export const phone = { width: 390, height: 800 } as const;

/** Opens every proof, as a reader revising would, so that checks cover what is inside them. */
export async function openAllBlocks(page: Page): Promise<void> {
	await page.evaluate(() => {
		for (const block of document.querySelectorAll("details")) block.open = true;
	});
}

/** Records what would tell a reader something is broken: script errors and failed requests. */
export function watchForProblems(page: Page): string[] {
	const problems: string[] = [];
	page.on("pageerror", (error) => problems.push(String(error)));
	page.on("requestfailed", (request) => problems.push(`failed ${request.url()}`));
	page.on("console", (message) => {
		if (message.type() === "error") problems.push(message.text());
	});
	return problems;
}
