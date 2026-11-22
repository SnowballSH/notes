import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

test("the Fourier spectrum follows the truth table", async ({ page, request }) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="fourier-spectrum"');
	} catch (error) {
		const unplaced =
			error instanceof Error && error.message.startsWith("no page of the site contains");
		if (!unplaced) throw error;
		test.skip(true, "no published note uses fourier-spectrum yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="fourier-spectrum"]').first();
	const polynomial = widget.locator("figcaption");
	const chart = widget.getByRole("img");

	await widget.getByRole("button", { name: "Majority", exact: true }).click();
	await expect(widget.getByRole("button", { name: "Majority", exact: true })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await expect(polynomial).toHaveText("f = 1/2 x₁ + 1/2 x₂ + 1/2 x₃ − 1/2 x₁x₂x₃");
	await expect(chart).toHaveAttribute(
		"aria-label",
		"Fourier coefficients: ∅ 0, {1} +1/2, {2} +1/2, {3} +1/2, {1,2} 0, {1,3} 0, {2,3} 0, {1,2,3} −1/2",
	);

	await widget.getByRole("button", { name: "AND", exact: true }).click();
	await expect(polynomial).toHaveText(
		"f = 3/4 + 1/4 x₁ + 1/4 x₂ + 1/4 x₃ − 1/4 x₁x₂ − 1/4 x₁x₃ − 1/4 x₂x₃ + 1/4 x₁x₂x₃",
	);

	await widget.getByRole("button", { name: "f(− − −) = −1" }).click();
	await expect(widget.getByRole("button", { name: "f(− − −) = +1" })).toBeVisible();
	await expect(polynomial).toHaveText("f = 1");
	await expect(widget.getByRole("button", { name: "AND", exact: true })).toHaveAttribute(
		"aria-pressed",
		"false",
	);
});
