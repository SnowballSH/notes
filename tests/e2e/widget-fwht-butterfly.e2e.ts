import { expect, test } from "@playwright/test";
import { openWidget } from "./pages";

test("the butterfly diagram computes the Walsh-Hadamard transform level by level", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "fwht-butterfly");
	const spoken = widget.locator("figcaption .spoken");
	const input = "Input: 1, 1, 1, −1, 1, −1, −1, −1.";
	const shown = widget.locator("figcaption .now");
	const next = widget.getByRole("button", { name: "Next level" });
	const back = widget.getByRole("button", { name: "Back" });
	const column = (name: string) => widget.locator(`[role="button"][aria-label^="${name}, f["]`);
	const legend = widget.locator("figcaption .legend");

	// A note may start the widget at a later level. Back is aria-disabled at the input, which
	// Playwright would wait on, so the presses are forced; the component ignores the extra ones.
	for (let press = 0; press < 3; press++) await back.click({ force: true });
	await expect(spoken).toHaveText(`Level 0 of 3: the input. ${input}`);
	await expect(shown).toHaveText("");
	await expect(next).toHaveText("Next");
	await expect(back).toHaveAttribute("aria-disabled", "true");
	await expect(column("Input")).toHaveText(["1", "1", "1", "−1", "1", "−1", "−1", "−1"]);
	await expect(column("After half = 1")).toHaveCount(0);
	await expect(legend).toBeVisible();
	await expect(legend).toHaveAttribute("aria-hidden", "true");

	await next.click();
	await expect(spoken).toHaveText(`After level 1 of 3: blocks of size 2 are transformed. ${input}`);
	await expect(column("After half = 1")).toHaveText(["2", "0", "0", "2", "0", "2", "−2", "0"]);
	await expect(widget.locator(".node.zero")).toHaveText(["0", "0", "0", "0"]);

	await next.click();
	await expect(spoken).toHaveText(`After level 2 of 3: blocks of size 4 are transformed. ${input}`);
	await expect(column("After half = 2")).toHaveText(["2", "2", "2", "−2", "−2", "2", "2", "2"]);

	await next.click();
	await expect(spoken).toHaveText(`After level 3 of 3: blocks of size 8 are transformed. ${input}`);
	await expect(column("After half = 4")).toHaveText(["0", "4", "4", "0", "4", "0", "0", "−4"]);
	await expect(next).toHaveAttribute("aria-disabled", "true");
	await expect(widget.locator("line.wire").last()).toContainClass("minus");

	const diagram = widget.getByRole("group", { name: /^Butterfly diagram/ });
	const frame = await diagram.boundingBox();
	const lastBox = await widget.locator('[data-node="3-7"] .box').boundingBox();
	const lastHeading = await widget.locator("text.heading").last().boundingBox();
	if (!frame || !lastBox || !lastHeading) throw new Error("the diagram is not laid out");
	const scale = Math.min(frame.width / 288, 1);
	expect(frame.height).toBeCloseTo(372 * scale, 0);
	expect(frame.x + frame.width - (lastBox.x + lastBox.width)).toBeGreaterThanOrEqual(5 * scale);
	expect(frame.x + frame.width - (lastHeading.x + lastHeading.width)).toBeGreaterThanOrEqual(
		4 * scale,
	);
	const headingSize = await widget
		.locator("text.heading")
		.first()
		.evaluate((heading) => parseFloat(getComputedStyle(heading).fontSize));
	expect(headingSize).toBe(12);

	const { mounted, reserved } = await widget.evaluate((element) => {
		const probe = document.createElement("div");
		probe.style.height = getComputedStyle(element).getPropertyValue("--widget-height");
		element.after(probe);
		const reserved = probe.getBoundingClientRect().height;
		probe.remove();
		return { mounted: element.getBoundingClientRect().height, reserved };
	});
	expect(Math.abs(mounted - reserved)).toBeLessThan(1);

	// Focusing may scroll the page; Chromium then reports the resting pointer as entering whatever
	// is under it, so the node is scrolled to and the pointer parked off the diagram first.
	const last = widget.getByRole("button", { name: "After half = 4, f[7] = −4" });
	await last.scrollIntoViewIfNeeded();
	await page.mouse.move(0, 0);
	await last.focus();
	await expect(shown).toHaveText("f[7] = f[3] − f[7] = −2 − 2 = −4");
	await expect(widget.locator("line.wire.lit")).toHaveCount(2);
	await expect(widget.locator("line.wire.lit.minus")).toHaveCount(1);
	await expect(legend).toBeHidden();

	await page.keyboard.press("ArrowUp");
	await expect(shown).toHaveText("f[6] = f[2] − f[6] = 2 − 2 = 0");
	await widget.locator('[data-node="0-3"]').hover();
	await expect(shown).toHaveText("f[3] = −1");
	await expect(widget.locator("line.wire.lit")).toHaveCount(0);
});

const levelCount = 3;
const parsed = (text: string): number => Number(text.replace("−", "-"));
const written = (value: number): string => String(value).replace("-", "−");

/** The array after each pass of the fast Walsh-Hadamard transform, computed apart from the widget. */
function passes(input: readonly number[]): number[][] {
	const columns: number[][] = [];
	let values = [...input];
	for (let half = 1; half < values.length; half *= 2) {
		const previous = values;
		values = previous.map((value, index) =>
			index & half ? (previous[index - half] ?? 0) - value : value + (previous[index + half] ?? 0),
		);
		columns.push(values);
	}
	return columns;
}

test("Random replaces the input and every level is computed again from it", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "fwht-butterfly");
	const random = widget.getByRole("button", { name: "Random values" });
	const next = widget.getByRole("button", { name: "Next level" });
	const column = (name: string) => widget.locator(`[role="button"][aria-label^="${name}, f["]`);
	const before = ["1", "1", "1", "−1", "1", "−1", "−1", "−1"];

	// Next is aria-disabled at the last level, which Playwright would wait on, so the presses are
	// forced; the component ignores the extra ones.
	for (let press = 0; press < levelCount; press++) await next.click({ force: true });
	await expect(column("Input")).toHaveText(before);
	await expect(column("After half = 4")).toHaveCount(before.length);

	// A draw repeats the old input once in 7⁸ presses; pressing again then gives another.
	await expect(async () => {
		await random.click();
		expect(await column("Input").allTextContents()).not.toEqual(before);
	}).toPass();

	const drawn = (await column("Input").allTextContents()).map((text) => text.trim());
	const input = drawn.map(parsed);
	expect(input).toHaveLength(before.length);
	for (const value of input) {
		expect(Number.isInteger(value)).toBe(true);
		expect(Math.abs(value)).toBeLessThanOrEqual(3);
	}

	const [first = [], second = [], third = []] = passes(input);
	await expect(column("After half = 1")).toHaveText(first.map(written));
	await expect(column("After half = 2")).toHaveText(second.map(written));
	await expect(column("After half = 4")).toHaveText(third.map(written));
	await expect(widget.locator("figcaption .spoken")).toHaveText(
		`After level 3 of 3: blocks of size 8 are transformed. Input: ${drawn.join(", ")}.`,
	);
});
