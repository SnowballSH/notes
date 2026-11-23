import { expect, type Page, test } from "@playwright/test";
import type { SearchEntry } from "../../src/lib/search/types.ts";
import { markers, pageWith, phone } from "./pages";

const openBlocks = (page: Page) =>
	page.evaluate(() =>
		[...document.querySelectorAll<HTMLDetailsElement>("article.note details")].map((block) =>
			block.open ? 1 : 0,
		),
	);

test("opened proofs and the scroll position survive a reload", async ({ page, request }) => {
	await page.goto(await pageWith(request, markers.proof), { waitUntil: "networkidle" });
	await page.locator("article.note details > summary").first().click();
	const halfway = await page.evaluate(() => {
		const position = Math.round((document.documentElement.scrollHeight - window.innerHeight) / 2);
		window.scrollTo(0, position);
		return position;
	});
	const before = await openBlocks(page);
	expect(before).toContain(1);

	await page.reload({ waitUntil: "networkidle" });

	await expect.poll(() => openBlocks(page)).toEqual(before);
	await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(halfway);
});

test("one link downloads the note as a PDF", async ({ page, request }) => {
	const note = await pageWith(request, markers.note);
	await page.goto(note, { waitUntil: "networkidle" });
	const link = page.getByRole("link", { name: "Download PDF" });
	await expect(link).toHaveAttribute("href", `${note}.pdf`);

	const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
	expect(download.suggestedFilename()).toBe(`${note.split("/").pop()}.pdf`);

	const response = await request.get(`${note}.pdf`);
	expect(response.status()).toBe(200);
	expect(response.headers()["content-type"]).toBe("application/pdf");
	expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("one button opens every proof, and starts afresh on the next note", async ({
	page,
	request,
}) => {
	await page.goto(await pageWith(request, markers.proof, markers.nextNote), {
		waitUntil: "networkidle",
	});
	await page.getByRole("button", { name: "Open all proofs" }).click();
	expect(new Set(await openBlocks(page))).toEqual(new Set([1]));
	await expect(page.getByRole("button", { name: "Close all proofs" })).toBeVisible();

	const first = page.url();
	await page.locator('a[rel="next"]').click();
	await expect(page).not.toHaveURL(first);
	await expect(page.getByRole("button", { name: "Close all proofs" })).toHaveCount(0);
});

/** The first reference in the note whose target is a card, with the card's numbered name. */
async function firstCardReference(page: Page): Promise<{ href: string; name: string }> {
	const found = await page.evaluate(() => {
		for (const link of document.querySelectorAll<HTMLAnchorElement>(
			'article.note a[href^="#"]:not(.anchor)',
		)) {
			const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
			const name = target?.matches(".card") ? target.querySelector("strong")?.textContent : null;
			if (name) return { href: link.getAttribute("href") ?? "", name };
		}
		return null;
	});
	if (!found) throw new Error("the note has no reference to a card");
	return found;
}

test("a reference shows the block it points at, and its link still goes there", async ({
	page,
	request,
}) => {
	await page.goto(await pageWith(request, markers.proof, 'class="card'), {
		waitUntil: "networkidle",
	});
	await page.getByRole("button", { name: "Open all proofs" }).click();
	const { href, name } = await firstCardReference(page);
	const reference = page.locator(`article.note a[href="${href}"]:not(.anchor)`).first();
	await reference.scrollIntoViewIfNeeded();

	await reference.hover();
	const preview = page.locator(".reference-preview");
	await expect(preview).toBeVisible();
	await expect(preview).toContainText(name);

	await page.mouse.move(2, 2);
	await expect(preview).toBeHidden();

	await reference.click();
	expect(new URL(page.url()).hash).toBe(href);
});

test("a card's own link does not preview the card", async ({ page, request }) => {
	await page.goto(await pageWith(request, 'class="anchor"'), { waitUntil: "networkidle" });
	const header = page.locator(".card > header").first();
	await header.hover();
	await header.locator(".anchor").hover();
	await page.waitForTimeout(500);
	await expect(page.locator(".reference-preview")).toBeHidden();
});

test("search finds a card by its name from the home page and goes to it", async ({
	page,
	request,
}) => {
	const index = (await (await request.get("/search.json")).json()) as SearchEntry[];
	const card = index.find((entry) => entry.kind === "card" && entry.label.includes(": "));
	if (!card) throw new Error("the search index has no titled card");

	await page.goto("/", { waitUntil: "networkidle" });
	await page.keyboard.press("Control+k");
	await page.getByRole("searchbox").fill(card.label);
	await expect(page.locator(".results a").first()).toHaveAttribute("href", card.href);
	await expect(page.getByRole("status")).toContainText("result");

	await page.keyboard.press("Enter");

	await expect(page).toHaveURL(new RegExp(`${card.href.replace("#", "#")}$`));
	await expect(page.locator(`[id="${card.href.split("#")[1]}"]`)).toBeInViewport();
});

test("the tiling widget loads without moving the page and names each step", async ({
	page,
	request,
}) => {
	await page.goto(await pageWith(request, markers.tiling), { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="hadamard-tiling"]').first();
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

	await expect(widget.locator("figcaption")).toHaveText(/^The \d+ by \d+ matrix\.$/);
	const narration = widget.locator("figcaption .spoken");
	const lines = widget.locator(".board path");
	const atRest = await narration.textContent();
	const linesAtRest = await lines.getAttribute("d");
	expect(linesAtRest).toMatch(/^M1 0V\d+M/);
	await widget.getByRole("button", { name: "Next matrix" }).click();
	await expect(narration).toHaveText("Shrink it into the top-left quarter.");
	await expect(narration).toHaveText(/^The \d+ by \d+ matrix\.$/, { timeout: 10_000 });
	expect(await narration.textContent()).not.toBe(atRest);
	expect(await lines.getAttribute("d")).not.toBe(linesAtRest);
});

test("two Hadamard gates unflip the qubit but not the coin, unless it is measured in between", async ({
	page,
	request,
}) => {
	await page.goto(await pageWith(request, markers.unflippingCoin), { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="unflipping-coin"]').first();
	const qubit = widget.getByRole("group", { name: "Qubit" });
	const coin = widget.getByRole("group", { name: "Classical coin" });
	const applyGate = widget.getByRole("button", { name: "Apply H" });
	const measure = widget.getByRole("button", { name: "Measure" });

	await expect(widget.locator(".history")).toHaveText(/^Steps so far:\s*\|0⟩$/);
	await expect(qubit.locator(".row-label")).toHaveText("Pr");
	await expect(coin.locator(".name")).toHaveText("Coin heads");
	await expect(coin.locator(".label")).toHaveText(["heads", "tails"]);
	await applyGate.click();
	await expect(widget.locator(".history")).toContainText("|0⟩ → H");
	await expect(qubit.locator(".amplitude")).toHaveText(["+1/√2", "+1/√2"]);
	await expect(qubit.locator(".chance-value")).toHaveText(["1/2", "1/2"]);
	await applyGate.click();
	await expect(qubit.locator(".amplitude")).toHaveText(["+1", "0"]);
	await expect(qubit.locator(".chance-value")).toHaveText(["1", "0"]);
	await expect(coin.locator(".chance-value")).toHaveText(["1/2", "1/2"]);
	await expect(coin.locator(".name")).toHaveText("Coin tossed");
	await expect(widget.locator("figcaption .result")).toHaveCount(0);
	await measure.click();
	await expect(widget.locator("figcaption .result")).toHaveText("Measured 0");

	await widget.getByRole("button", { name: "Start over" }).click();
	await applyGate.click();
	await measure.click();
	await applyGate.click();
	await expect(qubit.locator(".amplitude")).toHaveText([/^\+1\/√2$/, /^[+−]1\/√2$/]);
	await expect(qubit.locator(".chance-value")).toHaveText(["1/2", "1/2"]);
	await expect(widget.locator("figcaption .result")).toHaveCount(0);
});

test("a drawn state gets a Hadamard gate on every qubit, and a second one returns it", async ({
	page,
	request,
}) => {
	await page.goto(await pageWith(request, markers.hadamardAmplitudes), {
		waitUntil: "networkidle",
	});
	const widget = page.locator('notes-widget[name="hadamard-amplitudes"]').first();
	const drawn = widget.getByRole("group", { name: /drawable/ }).locator(".amplitude");
	const transformed = widget.getByRole("list", { name: /Hadamard gate/ }).locator(".amplitude");
	const drawnChances = widget.getByRole("group", { name: /drawable/ }).locator(".chance-value");
	const transformedChances = widget
		.getByRole("list", { name: /Hadamard gate/ })
		.locator(".chance-value");
	const applyGates = widget.getByRole("button", { name: /^Apply H/ });
	await expect(drawn).toHaveText(["+1", "0", "0", "0"]);
	await expect(transformed).toHaveText(["+1/2", "+1/2", "+1/2", "+1/2"]);
	await expect(drawnChances).toHaveText(["1", "0", "0", "0"]);
	await expect(transformedChances).toHaveText(["1/4", "1/4", "1/4", "1/4"]);
	await expect(widget.locator(".grip")).toHaveCount(4);

	const last = widget.getByRole("slider", { name: "Amplitude of 11" });
	await last.focus();
	await page.keyboard.press("End");
	await page.keyboard.press("Space");
	await expect(drawn).toHaveText(["+1/√2", "0", "0", "−1/√2"]);
	await expect(transformed).toHaveText(["0", "+1/√2", "+1/√2", "0"]);
	await expect(drawnChances).toHaveText(["1/2", "0", "0", "1/2"]);
	await expect(transformedChances).toHaveText(["0", "1/2", "1/2", "0"]);

	const second = widget.getByRole("slider", { name: "Amplitude of 01" });
	await second.focus();
	await page.keyboard.press("ArrowUp");
	await expect(drawn).not.toHaveText(["+1/√2", "0", "0", "−1/√2"]);
	await page.keyboard.press("ArrowDown");
	await expect(drawn).toHaveText(["+1/√2", "0", "0", "−1/√2"]);
	await expect(widget.locator("figcaption .spoken")).toHaveText(
		"State: 00 +1/√2, 11 −1/√2. After H: 01 +1/√2, 10 +1/√2.",
	);

	const plot = widget.getByRole("slider", { name: "Amplitude of 00" }).locator(".plot");
	await plot.scrollIntoViewIfNeeded();
	const box = await plot.boundingBox();
	if (!box) throw new Error("the first bar has no box");
	await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.9, { button: "right" });
	await page.keyboard.press("Escape");
	await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7);
	await expect(drawn).toHaveText(["+1/√2", "0", "0", "−1/√2"]);
	await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
	await page.mouse.up();
	await expect(drawn).toHaveText(["0", "0", "0", "−1"]);
	await expect(transformed).toHaveText(["−1/2", "+1/2", "+1/2", "−1/2"]);

	await applyGates.click();
	await expect(drawn).toHaveText(["−1/2", "+1/2", "+1/2", "−1/2"]);
	await expect(transformed).toHaveText(["0", "0", "0", "−1"]);
	await applyGates.click();
	await expect(drawn).toHaveText(["0", "0", "0", "−1"]);
});

test("a figure enlarges by click or from the keyboard, and Escape closes it", async ({
	page,
	request,
}) => {
	await page.goto(await pageWith(request, "<figure"), { waitUntil: "networkidle" });
	const image = page.locator('article.note figure img[role="button"]').first();
	await expect(image).toBeVisible();
	const thumbnail = (await image.boundingBox())?.width ?? 0;

	await image.click();
	const enlarged = page.locator("dialog.figure-zoom img");
	await expect(enlarged).toBeVisible();
	expect((await enlarged.boundingBox())?.width).toBeGreaterThan(thumbnail);
	await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(page.locator("dialog.figure-zoom")).toHaveCount(0);
	await expect(image).toBeFocused();

	await image.focus();
	await page.keyboard.press("Enter");
	await expect(enlarged).toBeVisible();
});

test("the home page offers to continue with the note read last", async ({ page, request }) => {
	await page.goto("/", { waitUntil: "networkidle" });
	await expect(page.getByRole("link", { name: "Start reading" }).first()).toBeVisible();

	const later = await pageWith(request, markers.note, 'rel="prev"');
	await page.goto(later, { waitUntil: "networkidle" });
	await page.goto("/", { waitUntil: "networkidle" });

	await expect(page.getByRole("link", { name: /^Continue with / }).first()).toHaveAttribute(
		"href",
		later,
	);
});

test.describe("on a phone", () => {
	test.use({ viewport: phone });

	test("the note starts on the first screen and the contents are one tap away", async ({
		page,
		request,
	}) => {
		await page.goto(await pageWith(request, markers.contents), { waitUntil: "networkidle" });
		const firstParagraph = page.locator("article.note > p").first();
		expect((await firstParagraph.boundingBox())?.y).toBeLessThan(phone.height / 2);

		await page.getByRole("button", { name: "Contents" }).click();
		const section = page.locator(".jump-menu ol a").last();
		const href = await section.getAttribute("href");
		await section.click();
		expect(new URL(page.url()).hash).toBe(href);
		await expect(page.locator(".jump-menu")).toBeHidden();
	});

	test("an equation either fits the screen or scrolls on its own and takes focus", async ({
		page,
		request,
	}) => {
		await page.goto(await pageWith(request, markers.equation, markers.proof), {
			waitUntil: "networkidle",
		});
		await page.getByRole("button", { name: "Open all proofs" }).click();
		await page.evaluate(() => document.fonts.ready);
		const equations = await page.evaluate(() =>
			[...document.querySelectorAll<HTMLElement>("article.note .equation")].map((equation) => ({
				scrolls: equation.scrollWidth > equation.clientWidth + 1,
				focusable: equation.tabIndex === 0,
				pastScreen: equation.getBoundingClientRect().right > window.innerWidth + 1,
			})),
		);
		expect(equations.length).toBeGreaterThan(0);
		expect(equations.filter((equation) => equation.pastScreen)).toEqual([]);
		expect(equations.filter((equation) => equation.scrolls !== equation.focusable)).toEqual([]);
	});

	test("a code block either fits the screen or scrolls on its own and takes focus", async ({
		page,
		request,
	}) => {
		await page.goto(await pageWith(request, markers.note, markers.code), {
			waitUntil: "networkidle",
		});
		await page.evaluate(() => document.fonts.ready);
		const blocks = await page.evaluate(() =>
			[...document.querySelectorAll<HTMLElement>("article.note pre")].map((block) => ({
				scrolls: block.scrollWidth > block.clientWidth + 1,
				focusable: block.tabIndex === 0,
			})),
		);
		expect(blocks.length).toBeGreaterThan(0);
		expect(blocks.filter((block) => block.scrolls !== block.focusable)).toEqual([]);
	});
});
