import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

test("the convolution grid sums the cells that share an XOR", async ({ page, request }) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="convolution-grid"');
	} catch {
		test.skip(true, "no published note uses convolution-grid yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="convolution-grid"]').first();
	const sum = widget.locator("figcaption");
	const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const chip = (name: string) =>
		widget.getByRole("button", {
			name: new RegExp(`^${[...name.replaceAll(" ", "")].map(escaped).join("\\s*")}$`),
		});
	const outlined = widget.locator('[role="cell"][aria-current="true"]');

	await expect(sum).toHaveText("(f ∗ g)(01) = 1·1 + 2·3 + 0·0 + 1·2 = 9");
	await expect(chip("(f ∗ g)(00) = 5")).toBeVisible();
	await expect(chip("(f ∗ g)(01) = 9")).toHaveAttribute("aria-pressed", "true");
	await expect(chip("(f ∗ g)(11) = 7")).toBeVisible();

	await chip("(f ∗ g)(10) = 3").click();
	await expect(chip("(f ∗ g)(10) = 3")).toHaveAttribute("aria-pressed", "true");
	await expect(sum).toHaveText("(f ∗ g)(10) = 1·2 + 2·0 + 0·3 + 1·1 = 3");
	await expect(outlined).toHaveCount(4);
	await expect(outlined.first()).toHaveAttribute("aria-label", "f(00)·g(10) = 2, z = 10");
	await expect(outlined.last()).toHaveAttribute("aria-label", "f(11)·g(01) = 1, z = 10");

	await widget.getByRole("button", { name: "Increase f(10)", exact: true }).click();
	await expect(sum).toHaveText("(f ∗ g)(10) = 1·2 + 2·0 + 1·3 + 1·1 = 6");
	await expect(chip("(f ∗ g)(00) = 7")).toBeVisible();

	await widget.getByRole("button", { name: "Decrease g(11)", exact: true }).click();
	await expect(sum).toHaveText("(f ∗ g)(10) = 1·2 + 2·(−1) + 1·3 + 1·1 = 4");
	await expect(chip("(f ∗ g)(10) = 4")).toHaveAttribute("aria-pressed", "true");

	await expect(widget.getByRole("button", { name: "Increase g(00)", exact: true })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
});
