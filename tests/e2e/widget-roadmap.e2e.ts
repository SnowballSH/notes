import { expect, test } from "@playwright/test";
import { walshHadamard } from "../../src/lib/outlines/walsh-hadamard.ts";
import type { SearchEntry } from "../../src/lib/search/types.ts";
import { dependencies } from "../../src/lib/widgets/roadmap/dependencies.ts";
import { needsText, roadmapSections } from "../../src/lib/widgets/roadmap/sections.ts";
import { openWidget } from "./pages";

test("the roadmap links a section exactly when its note is published", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "roadmap");
	const items = widget.getByRole("list", { name: "Course roadmap" }).getByRole("listitem");

	const index = await request.get("/search.json");
	expect(index.ok()).toBe(true);
	const entries: SearchEntry[] = await index.json();
	const published = new Set(entries.flatMap(({ kind, href }) => (kind === "note" ? [href] : [])));
	const sections = roadmapSections(walshHadamard, dependencies);
	const linked = sections.filter(({ href }) => href !== null && published.has(href));

	await expect(items).toHaveCount(sections.length);
	await expect(items.getByRole("link")).toHaveCount(linked.length);

	for (const [position, { number, title, href, needs }] of sections.entries()) {
		const item = items.nth(position);
		const link = item.getByRole("link");
		await expect(item.locator(".number")).toHaveText(number);
		await expect(item.locator(".title")).toHaveText(title);
		if (href !== null && published.has(href)) {
			await expect(link).toHaveAttribute("href", href);
			await expect(link).toHaveAccessibleName(`${number} ${title}`);
		} else {
			await expect(link).toHaveCount(0);
		}
		if (needs.length > 0) await expect(item.locator(".spoken")).toHaveText(needsText(needs));
		else await expect(item.locator(".spoken")).toHaveCount(0);
	}
});
