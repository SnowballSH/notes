import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openAllBlocks, phone, sitePages, watchForProblems } from "./pages";

test("every page loads without errors and never scrolls sideways", async ({ page, request }) => {
	const problems = watchForProblems(page);
	const paths = await sitePages(request);
	expect(paths.length).toBeGreaterThan(1);
	for (const path of paths) {
		for (const viewport of [{ width: 1280, height: 800 }, phone]) {
			await test.step(`${path} at ${viewport.width}px`, async () => {
				await page.setViewportSize(viewport);
				await page.goto(path, { waitUntil: "networkidle" });
				await openAllBlocks(page);
				const overflows = await page.evaluate(
					() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
				);
				expect(overflows, `${path} scrolls sideways at ${viewport.width}px`).toBe(false);
			});
		}
	}
	expect(problems).toEqual([]);
});

for (const colorScheme of ["light", "dark"] as const) {
	test(`every page passes the accessibility checks in the ${colorScheme} theme`, async ({
		page,
		request,
	}) => {
		test.slow();
		await page.emulateMedia({ colorScheme });
		await page.setViewportSize(phone);
		for (const path of await sitePages(request)) {
			await test.step(path, async () => {
				await page.goto(path, { waitUntil: "networkidle" });
				await openAllBlocks(page);
				const { violations } = await new AxeBuilder({ page }).analyze();
				expect(
					violations.map((violation) => `${path}: ${violation.id}: ${violation.help}`),
				).toEqual([]);
			});
		}
	});
}

test("an address that does not exist gets the not-found page", async ({ page }) => {
	const response = await page.goto("/no/such-page");
	expect(response?.status()).toBe(404);
	await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
