import { type APIRequestContext, expect, type Locator, type Page, test } from "@playwright/test";
import { pageWith } from "./pages";

async function openWidget(page: Page, request: APIRequestContext): Promise<Locator | undefined> {
	let path: string;
	try {
		path = await pageWith(request, 'name="grover-rotation"');
	} catch {
		return undefined;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	return page.locator('notes-widget[name="grover-rotation"]').first();
}

test("the Grover rotation climbs to the best count and falls after it", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request);
	if (!widget) {
		test.skip(true, "no published note uses grover-rotation yet");
		return;
	}
	const caption = widget.locator('figcaption p[aria-hidden="true"]');
	const spoken = widget.locator("figcaption .spoken");
	const iterate = widget.getByRole("button", { name: "Iterate", exact: true });
	const back = widget.getByRole("button", { name: "Back", exact: true });
	const fewer = widget.getByRole("button", { name: "Fewer marked inputs" });
	const picture = widget.getByRole("img", { name: /^Upper half of the unit circle/ });

	await widget.getByRole("slider", { name: "Number of qubits n" }).fill("3");
	// A note may start the widget with any k. The button is aria-disabled at k = 1, which Playwright
	// would wait on, so it is pressed only while it is enabled.
	while ((await fewer.getAttribute("aria-disabled")) !== "true") await fewer.click();
	await expect(fewer).toHaveAttribute("aria-disabled", "true");
	await expect(widget.getByRole("group", { name: "Number of marked inputs k" })).toContainText(
		"k = 1, N = 8",
	);
	await expect(caption).toHaveText("t = 0, P = 0.125");
	await expect(back).toHaveAttribute("aria-disabled", "true");
	await expect(picture.locator(".best-label")).toHaveText("T = 2");
	await expect(picture.locator(".turn-label")).toHaveText("θ");

	await iterate.click();
	await expect(caption).toHaveText("t = 1, P = 0.781");
	await expect(picture.locator(".turn-label")).toHaveText("2θ");
	await iterate.click();
	await expect(caption).toHaveText("t = 2, P = 0.945");
	await expect(spoken).toHaveText("t = 2 of T = 2: angle 5θ ≈ 1.81, probability 0.945.");
	await expect(picture.locator(".chance")).toHaveText("0.945");
	await expect(picture.locator(".earlier-dot")).toHaveCount(2);

	await iterate.click();
	await expect(caption).toHaveText("t = 3, P = 0.330");
	await expect(iterate).toHaveAttribute("aria-disabled", "true");

	await back.click();
	await expect(caption).toHaveText("t = 2, P = 0.945");
	await widget.getByRole("button", { name: "Reset", exact: true }).click();
	await expect(caption).toHaveText("t = 0, P = 0.125");
});

test("the Grover rotation finds one of four inputs with certainty in one iteration", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request);
	if (!widget) {
		test.skip(true, "no published note uses grover-rotation yet");
		return;
	}
	const caption = widget.locator('figcaption p[aria-hidden="true"]');
	const spoken = widget.locator("figcaption .spoken");
	const iterate = widget.getByRole("button", { name: "Iterate", exact: true });

	await widget.getByRole("slider", { name: "Number of qubits n" }).fill("2");
	await expect(caption).toHaveText("t = 0, P = 0.250");
	await expect(widget.getByRole("button", { name: "More marked inputs" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	await iterate.click();
	await expect(caption).toHaveText("t = 1, P = 1");
	await expect(spoken).toHaveText("t = 1 of T = 1: angle 3θ ≈ 1.57, probability 1.");
	await iterate.click();
	await expect(caption).toHaveText("t = 2, P = 0.250");
	await expect(iterate).toHaveAttribute("aria-disabled", "true");
});
