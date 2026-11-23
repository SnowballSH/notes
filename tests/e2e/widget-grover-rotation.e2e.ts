import { expect, test } from "@playwright/test";
import { openWidget, phone } from "./pages";

test("the Grover rotation climbs to the best count and falls to the far side of the axis", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "grover-rotation");
	const caption = widget.locator('figcaption p[aria-hidden="true"]');
	const spoken = widget.locator("figcaption .spoken");
	const iterate = widget.getByRole("button", { name: "Iterate", exact: true });
	const back = widget.getByRole("button", { name: "Back", exact: true });
	const fewer = widget.getByRole("button", { name: "Fewer marked inputs" });
	const picture = widget.getByRole("img", { name: /^Upper half of the unit circle/ });
	const chance = picture.locator(".chance");

	await widget.getByRole("slider", { name: "Number of qubits n" }).fill("3");
	// A note may start the widget with any k. The button is aria-disabled at k = 1, which Playwright
	// would wait on, so it is pressed only while it is enabled.
	while ((await fewer.getAttribute("aria-disabled")) !== "true") await fewer.click();
	await expect(fewer).toHaveAttribute("aria-disabled", "true");
	await expect(widget.getByRole("group", { name: "Number of marked inputs k" })).toContainText(
		"k = 1",
	);
	await expect(caption).toHaveText("N = 8, t = 0");
	await expect(chance).toHaveText("P = 0.125");
	await expect(back).toHaveAttribute("aria-disabled", "true");
	await expect(picture.locator(".best-label")).toHaveText("T = 2");
	await expect(picture.locator(".turn-label")).toHaveText("θ");

	await iterate.click();
	await expect(caption).toHaveText("N = 8, t = 1");
	await expect(chance).toHaveText("P = 0.781");
	await expect(picture.locator(".turn-label")).toHaveText("2θ");
	await iterate.click();
	await expect(caption).toHaveText("N = 8, t = 2");
	await expect(spoken).toHaveText("N = 8, t = 2 of T = 2: angle 5θ ≈ 1.81, probability 0.945.");
	await expect(chance).toHaveText("P = 0.945");
	await expect(picture.locator(".earlier-dot")).toHaveCount(2);

	await iterate.click();
	await expect(chance).toHaveText("P = 0.330");
	await expect(iterate).toHaveAttribute("aria-disabled", "false");
	await iterate.click();
	await expect(caption).toHaveText("N = 8, t = 4");
	await expect(spoken).toHaveText("N = 8, t = 4 of T = 2: angle 9θ ≈ 3.25, probability 0.012.");
	await expect(chance).toHaveText("P = 0.012");
	await expect(iterate).toHaveAttribute("aria-disabled", "true");
	const axis = await picture.locator(".axis").first().boundingBox();
	const tip = await picture.locator(".head").boundingBox();
	const square = await picture.locator(".square").boundingBox();
	const label = await chance.boundingBox();
	const frame = await picture.boundingBox();
	if (!axis || !tip || !square || !label || !frame) throw new Error("the picture is not laid out");
	expect(tip.y + tip.height).toBeGreaterThan(axis.y + axis.height);
	expect(square.y + 1).toBeGreaterThan(axis.y);
	expect(label.y).toBeGreaterThan(square.y + square.height - 1);
	expect(label.x).toBeGreaterThanOrEqual(frame.x);
	expect(label.y + label.height).toBeLessThanOrEqual(frame.y + frame.height + 1);

	await back.click();
	await back.click();
	await expect(caption).toHaveText("N = 8, t = 2");
	await widget.getByRole("button", { name: "Reset", exact: true }).click();
	await expect(caption).toHaveText("N = 8, t = 0");
	await expect(chance).toHaveText("P = 0.125");
});

test("the Grover rotation keeps its labels apart and readable on a phone", async ({
	page,
	request,
}) => {
	await page.setViewportSize(phone);
	const widget = await openWidget(page, request, "grover-rotation");
	const picture = widget.getByRole("img", { name: /^Upper half of the unit circle/ });
	const slider = widget.getByRole("slider", { name: "Number of qubits n" });
	const stepper = widget.getByRole("group", { name: "Number of marked inputs k" });

	const sliderBox = await slider.boundingBox();
	const stepperBox = await stepper.boundingBox();
	if (!sliderBox || !stepperBox) throw new Error("the settings are not laid out");
	expect(stepperBox.x).toBeGreaterThan(sliderBox.x + sliderBox.width);
	expect(stepperBox.y).toBeLessThan(sliderBox.y + sliderBox.height);

	for (const qubits of ["3", "8"]) {
		await slider.fill(qubits);
		const chance = await picture.locator(".chance").boundingBox();
		const unmarked = await picture.locator(".axis-label").first().boundingBox();
		const axis = await picture.locator(".axis").first().boundingBox();
		const frame = await picture.boundingBox();
		if (!chance || !unmarked || !axis || !frame) throw new Error("the picture is not laid out");
		expect(unmarked.x).toBeGreaterThan(chance.x + chance.width);
		expect(unmarked.x).toBeGreaterThan(axis.x + axis.width);
		expect(unmarked.x + unmarked.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
		expect(chance.y).toBeGreaterThan(axis.y);
	}
	const shownSize = await picture
		.locator(".chance")
		.evaluate(
			(text: SVGGraphicsElement) =>
				Number.parseFloat(getComputedStyle(text).fontSize) * (text.getScreenCTM()?.a ?? 0),
		);
	expect(shownSize).toBeCloseTo(12, 0);
});

test("the Grover rotation finds one of four inputs with certainty in one iteration", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "grover-rotation");
	const caption = widget.locator('figcaption p[aria-hidden="true"]');
	const spoken = widget.locator("figcaption .spoken");
	const iterate = widget.getByRole("button", { name: "Iterate", exact: true });

	await widget.getByRole("slider", { name: "Number of qubits n" }).fill("2");
	const chance = widget.locator("svg .chance");
	await expect(caption).toHaveText("N = 4, t = 0");
	await expect(chance).toHaveText("P = 0.250");
	await expect(widget.getByRole("button", { name: "More marked inputs" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	await iterate.click();
	await expect(caption).toHaveText("N = 4, t = 1");
	await expect(chance).toHaveText("P = 1");
	await expect(spoken).toHaveText("N = 4, t = 1 of T = 1: angle 3θ ≈ 1.57, probability 1.");
	await iterate.click();
	await expect(caption).toHaveText("N = 4, t = 2");
	await expect(chance).toHaveText("P = 0.250");
	await expect(iterate).toHaveAttribute("aria-disabled", "true");
});
