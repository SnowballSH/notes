import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

test("the butterfly diagram computes the Walsh-Hadamard transform level by level", async ({
	page,
	request,
}) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="fwht-butterfly"');
	} catch {
		test.skip(true, "no published note uses fwht-butterfly yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="fwht-butterfly"]').first();
	const spoken = widget.locator("figcaption .spoken");
	const shown = widget.locator("figcaption .now");
	const next = widget.getByRole("button", { name: "Next level" });
	const back = widget.getByRole("button", { name: "Back" });
	const column = (name: string) => widget.locator(`[role="button"][aria-label^="${name}, f["]`);

	// A note may start the widget at a later level. Back is aria-disabled at the input, which
	// Playwright would wait on, so the presses are forced; the component ignores the extra ones.
	for (let press = 0; press < 3; press++) await back.click({ force: true });
	await expect(spoken).toHaveText("Level 0 of 3: the input.");
	await expect(shown).toHaveText("");
	await expect(next).toHaveText("Next");
	await expect(back).toHaveAttribute("aria-disabled", "true");
	await expect(column("Input")).toHaveText(["1", "1", "1", "−1", "1", "−1", "−1", "−1"]);
	await expect(column("After half = 1")).toHaveCount(0);

	await next.click();
	await expect(spoken).toHaveText("After level 1 of 3: blocks of size 2 are transformed.");
	await expect(column("After half = 1")).toHaveText(["2", "0", "0", "2", "0", "2", "−2", "0"]);

	await next.click();
	await expect(spoken).toHaveText("After level 2 of 3: blocks of size 4 are transformed.");
	await expect(column("After half = 2")).toHaveText(["2", "2", "2", "−2", "−2", "2", "2", "2"]);

	await next.click();
	await expect(spoken).toHaveText("After level 3 of 3: blocks of size 8 are transformed.");
	await expect(column("After half = 4")).toHaveText(["0", "4", "4", "0", "4", "0", "0", "−4"]);
	await expect(next).toHaveAttribute("aria-disabled", "true");

	// Focusing may scroll the page; Chromium then reports the resting pointer as entering whatever
	// is under it, so the node is scrolled to and the pointer parked off the diagram first.
	const last = widget.getByRole("button", { name: "After half = 4, f[7] = −4" });
	await last.scrollIntoViewIfNeeded();
	await page.mouse.move(0, 0);
	await last.focus();
	await expect(shown).toHaveText("f[7] = f[3] − f[7] = −2 − 2 = −4");
	await expect(widget.locator("line.wire.lit")).toHaveCount(2);
	await expect(widget.locator("line.wire.lit.minus")).toHaveCount(1);

	await page.keyboard.press("ArrowUp");
	await expect(shown).toHaveText("f[6] = f[2] − f[6] = 2 − 2 = 0");
	await widget.locator('[data-node="0-3"]').hover();
	await expect(shown).toHaveText("f[3] = −1");
	await expect(widget.locator("line.wire.lit")).toHaveCount(0);
});
