import type { APIRequestContext, Page } from "@playwright/test";

export const phone = { width: 390, height: 800 } as const;

const internalLink = /href="(\/(?!\/)[^"#?]*)["#?]/g;
const sitemapAddress = /<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g;
const isPage = (path: string): boolean => !path.startsWith("/_app/") && !/\.[a-z0-9]+$/.test(path);

/** Every page of the built site: those the sitemap lists, and those its own links lead to. */
export async function sitePages(request: APIRequestContext): Promise<string[]> {
	const sitemap = await (await request.get("/sitemap.xml")).text();
	const found = new Set([
		"/",
		...[...sitemap.matchAll(sitemapAddress)].flatMap(([, path]) => path ?? []),
	]);
	for (const path of found) {
		const html = await (await request.get(path)).text();
		for (const [, href] of html.matchAll(internalLink)) {
			if (href !== undefined && isPage(href)) found.add(href);
		}
	}
	return [...found];
}

/** The first page whose HTML contains every marker, such as a proof or a widget. */
export async function pageWith(request: APIRequestContext, ...markers: string[]): Promise<string> {
	for (const path of await sitePages(request)) {
		const html = await (await request.get(path)).text();
		if (markers.every((marker) => html.includes(marker))) return path;
	}
	throw new Error(`no page of the site contains ${markers.join(" and ")}`);
}

export const markers = {
	note: '<article class="note',
	proof: '<details class="proof"',
	nextNote: 'rel="next"',
	tiling: 'name="hadamard-tiling"',
	equation: 'class="equation"',
	contents: 'class="jump-button',
} as const;

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
