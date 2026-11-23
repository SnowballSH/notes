import { expect, test } from "@playwright/test";
import { openWidget } from "./pages";

test("the Fourier spectrum follows the truth table", async ({ page, request }) => {
	const widget = await openWidget(page, request, "fourier-spectrum");
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

	await expect(chart).toContainText("f\u0302(S)");
	await expect(chart.locator(".coefficient")).toHaveText([
		"0",
		"+1/2",
		"+1/2",
		"+1/2",
		"0",
		"0",
		"0",
		"−1/2",
	]);

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
