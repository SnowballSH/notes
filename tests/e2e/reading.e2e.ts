import { expect, test } from "@playwright/test";
import { chapter, phone } from "./pages";

const openBlocks = (page: import("@playwright/test").Page) =>
	page.evaluate(() =>
		[...document.querySelectorAll("article.note details")].map((block) =>
			(block as HTMLDetailsElement).open ? 1 : 0,
		),
	);

test("opened proofs and the scroll position survive a reload", async ({ page }) => {
	await page.goto(chapter.second, { waitUntil: "networkidle" });
	await page.locator("article.note details > summary").nth(0).click();
	await page.locator("article.note details > summary").nth(2).click();
	await page.evaluate(() => window.scrollTo(0, 3000));
	const before = await openBlocks(page);

	await page.reload({ waitUntil: "networkidle" });

	await expect.poll(() => openBlocks(page)).toEqual(before);
	await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(3000);
});

test("one button opens and closes every proof, and resets on the next note", async ({ page }) => {
	await page.goto(chapter.first, { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "Open all proofs" }).click();
	expect(new Set(await openBlocks(page))).toEqual(new Set([1]));

	await page.locator('a[rel="next"]').click();
	await page.waitForURL(`**${chapter.second}`);
	await expect(page.getByRole("button", { name: "Open all proofs" })).toBeVisible();
});

test("a reference shows the block it points at, and its link still goes there", async ({
	page,
}) => {
	await page.goto(chapter.first, { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "Open all proofs" }).click();
	const reference = page.locator('article.note a[href="#prop-coefficient-formula"]').first();
	await reference.scrollIntoViewIfNeeded();

	await reference.hover();
	const preview = page.locator(".reference-preview");
	await expect(preview).toBeVisible();
	await expect(preview).toContainText("Formula for the Fourier Coefficients");

	await page.mouse.move(2, 2);
	await expect(preview).toBeHidden();

	await reference.click();
	await expect(page).toHaveURL(/#prop-coefficient-formula$/);
});

test("a card's own link does not preview the card", async ({ page }) => {
	await page.goto(chapter.first, { waitUntil: "networkidle" });
	const header = page.locator(".card > header").first();
	await header.hover();
	await header.locator(".anchor").hover();
	await page.waitForTimeout(500);
	await expect(page.locator(".reference-preview")).toBeHidden();
});

test("search finds a named theorem from any page and goes to it", async ({ page }) => {
	await page.goto("/", { waitUntil: "networkidle" });
	await page.keyboard.press("Control+k");
	await page.getByRole("searchbox").fill("parseval");
	await expect(page.locator(".results a")).toHaveCount(1);
	await expect(page.getByRole("status")).toHaveText("1 result");

	await page.keyboard.press("Enter");

	await expect(page).toHaveURL(/boolean-functions#thm-plancherel$/);
	await expect(page.locator("#thm-plancherel")).toBeInViewport();
});

test("the tiling widget loads without moving the page and names each step", async ({ page }) => {
	await page.goto(chapter.second, { waitUntil: "networkidle" });
	const widget = page.locator("notes-widget");
	await expect(widget.locator(".board")).toBeVisible();
	const { mounted, reserved } = await widget.evaluate((element) => {
		const probe = document.createElement("div");
		probe.style.height = getComputedStyle(element).getPropertyValue("--widget-height");
		element.after(probe);
		const reserved = probe.getBoundingClientRect().height;
		probe.remove();
		return { mounted: element.getBoundingClientRect().height, reserved };
	});
	expect(Math.abs(mounted - reserved)).toBeLessThan(1);

	await expect(widget.locator("figcaption")).toContainText("The 2 by 2 matrix.");
	await widget.getByRole("button", { name: "Next matrix" }).click();
	await expect(widget.locator("figcaption")).toContainText("Shrink it into the top-left quarter.");
	await widget.getByRole("button", { name: "Next matrix" }).click();
	await expect(widget.locator("figcaption")).toContainText("The 8 by 8 matrix.", {
		timeout: 10_000,
	});
});

test.describe("on a phone", () => {
	test.use({ viewport: phone });

	test("the note starts on the first screen and the contents are one tap away", async ({
		page,
	}) => {
		await page.goto(chapter.second, { waitUntil: "networkidle" });
		const firstParagraph = page.locator("article.note > p").first();
		expect((await firstParagraph.boundingBox())?.y).toBeLessThan(400);

		await page.getByRole("button", { name: "Contents" }).click();
		await page.locator(".jump-menu a").nth(2).click();
		await expect(page).toHaveURL(/#efficiently-computing-the-fourier-expansion$/);
		await expect(page.locator(".jump-menu")).toBeHidden();
	});

	test("an equation either fits the screen or scrolls on its own and takes focus", async ({
		page,
	}) => {
		await page.goto(chapter.second, { waitUntil: "networkidle" });
		await page.getByRole("button", { name: "Open all proofs" }).click();
		await page.evaluate(() => document.fonts.ready);
		const equations = await page.evaluate(() =>
			[...document.querySelectorAll<HTMLElement>(".equation")].map((equation) => ({
				scrolls: equation.scrollWidth > equation.clientWidth + 1,
				focusable: equation.tabIndex === 0,
				pastScreen: equation.getBoundingClientRect().right > window.innerWidth + 1,
			})),
		);
		expect(equations.length).toBeGreaterThan(10);
		expect(equations.filter((equation) => equation.pastScreen)).toEqual([]);
		expect(equations.filter((equation) => equation.scrolls !== equation.focusable)).toEqual([]);
		expect(equations.filter((equation) => equation.scrolls).length).toBeLessThan(4);
	});
});
