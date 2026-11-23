import { type APIRequestContext, type Locator, type Page, test } from "@playwright/test";

export const phone = { width: 390, height: 800 } as const;

const internalLink = /href="(\/(?!\/)[^"#?]*)["#?]/g;
const sitemapAddress = /<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g;
const isPage = (path: string): boolean => !path.startsWith("/_app/") && !/\.[a-z0-9]+$/.test(path);

class NoSuchPageError extends Error {
	override readonly name = "NoSuchPageError";
}

export type PlacedProps = Readonly<Record<string, unknown>>;

const widgetTag = /<notes-widget\b[^>]*>/g;
const entities: Readonly<Record<string, string>> = {
	"&quot;": '"',
	"&#34;": '"',
	"&#39;": "'",
	"&lt;": "<",
	"&gt;": ">",
	"&amp;": "&",
};

const attribute = (tag: string, name: string): string | undefined =>
	tag
		.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]
		?.replace(/&(?:quot|#34|#39|lt|gt|amp);/g, (entity) => entities[entity] ?? entity);

function placedProps(html: string, name: string): PlacedProps[] {
	return (html.match(widgetTag) ?? [])
		.filter((tag) => attribute(tag, "name") === name)
		.map((tag): PlacedProps => {
			const props: unknown = JSON.parse(attribute(tag, "props") ?? "{}");
			return typeof props === "object" && props !== null ? { ...props } : {};
		});
}

export async function sitePages(request: APIRequestContext): Promise<string[]> {
	const sitemap = await request.get("/sitemap.xml");
	const listed = [...(await sitemap.text()).matchAll(sitemapAddress)].flatMap(
		([, path]) => path ?? [],
	);
	if (!sitemap.ok() || listed.length === 0) throw new Error("sitemap.xml lists no pages");
	const found = new Set(["/", ...listed]);
	for (const path of found) {
		const html = await (await request.get(path)).text();
		for (const [, href] of html.matchAll(internalLink)) {
			if (href !== undefined && isPage(href)) found.add(href);
		}
	}
	return [...found];
}

export async function pageWith(request: APIRequestContext, ...markers: string[]): Promise<string> {
	for (const path of await sitePages(request)) {
		const html = await (await request.get(path)).text();
		if (markers.every((marker) => html.includes(marker))) return path;
	}
	throw new NoSuchPageError(`no page of the site contains ${markers.join(" and ")}`);
}

interface Placement {
	path: string;
	index: number;
}

async function placementOf(
	request: APIRequestContext,
	name: string,
	placed: (props: PlacedProps) => boolean,
): Promise<Placement> {
	for (const path of await sitePages(request)) {
		const html = await (await request.get(path)).text();
		const index = placedProps(html, name).findIndex(placed);
		if (index >= 0) return { path, index };
	}
	throw new NoSuchPageError(`no page of the site has the ${name} widget looked for`);
}

export async function openWidget(
	page: Page,
	request: APIRequestContext,
	name: string,
	placed: (props: PlacedProps) => boolean = () => true,
): Promise<Locator> {
	try {
		const { path, index } = await placementOf(request, name, placed);
		await page.goto(path, { waitUntil: "networkidle" });
		return page.locator(`notes-widget[name="${name}"]`).nth(index);
	} catch (error) {
		test.skip(
			error instanceof NoSuchPageError,
			`no published note has the ${name} widget this test needs`,
		);
		throw error;
	}
}

export const markers = {
	note: '<article class="note',
	proof: '<details class="proof"',
	nextNote: 'rel="next"',
	tiling: 'name="hadamard-tiling"',
	unflippingCoin: 'name="unflipping-coin"',
	hadamardAmplitudes: 'name="hadamard-amplitudes"',
	equation: 'class="equation"',
	code: "<pre",
	contents: 'class="jump-button',
} as const;

export async function openAllBlocks(page: Page): Promise<void> {
	await page.evaluate(() => {
		for (const block of document.querySelectorAll("details")) block.open = true;
	});
}

export function watchForProblems(page: Page): string[] {
	const problems: string[] = [];
	page.on("pageerror", (error) => problems.push(String(error)));
	page.on("requestfailed", (request) => problems.push(`failed ${request.url()}`));
	page.on("console", (message) => {
		if (message.type() === "error") problems.push(message.text());
	});
	return problems;
}
