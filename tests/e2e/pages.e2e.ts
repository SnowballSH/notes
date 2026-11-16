import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openAllBlocks, pages, phone, watchForProblems } from "./pages";

for (const path of pages) {
	test.describe(path, () => {
		test("loads without errors and never scrolls sideways", async ({ page }) => {
			const problems = watchForProblems(page);
			for (const viewport of [{ width: 1280, height: 800 }, phone]) {
				await page.setViewportSize(viewport);
				await page.goto(path, { waitUntil: "networkidle" });
				await openAllBlocks(page);
				const overflows = await page.evaluate(
					() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
				);
				expect(overflows, `sideways scroll at ${viewport.width}px`).toBe(false);
			}
			expect(problems).toEqual([]);
		});

		for (const colorScheme of ["light", "dark"] as const) {
			test(`passes the accessibility checks in the ${colorScheme} theme`, async ({ page }) => {
				await page.emulateMedia({ colorScheme });
				await page.setViewportSize(phone);
				await page.goto(path, { waitUntil: "networkidle" });
				await openAllBlocks(page);
				const { violations } = await new AxeBuilder({ page }).analyze();
				expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
			});
		}
	});
}

test("an address that does not exist gets the not-found page", async ({ page }) => {
	const response = await page.goto("/no/such-page");
	expect(response?.status()).toBe(404);
	await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
