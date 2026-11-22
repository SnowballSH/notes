import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

test("the Hadamard gate reflects a qubit on the circle, and twice returns it", async ({
	page,
	request,
}) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="qubit-circle"');
	} catch {
		test.skip(true, "no published note uses qubit-circle yet");
		return;
	}
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="qubit-circle"]').first();
	const caption = widget.locator("figcaption");
	const applyHadamard = widget.getByRole("button", { name: "Apply H" });
	const preset = (name: string) => widget.getByRole("button", { name, exact: true });
	const handle = widget.getByRole("slider", { name: "Angle of the state" });
	const amplitudes = widget.locator(".amplitude");
	const chances = widget.locator(".chance-value");

	await preset("|0⟩").click();
	await expect(caption).toHaveText("α = +1, β = 0");
	await expect(chances).toHaveText(["1", "0"]);

	await applyHadamard.click();
	await expect(caption).toHaveText("α = +1/√2, β = +1/√2");
	await expect(preset("|+⟩")).toHaveAttribute("aria-pressed", "true");
	await expect(amplitudes).toHaveText(["+1/√2", "+1/√2"]);
	await expect(chances).toHaveText(["1/2", "1/2"]);

	await applyHadamard.click();
	await expect(caption).toHaveText("α = +1, β = 0");

	await preset("|1⟩").click();
	await expect(caption).toHaveText("α = 0, β = +1");
	await applyHadamard.click();
	await expect(caption).toHaveText("α = +1/√2, β = −1/√2");
	await expect(preset("|−⟩")).toHaveAttribute("aria-pressed", "true");
	await expect(amplitudes).toHaveText(["+1/√2", "−1/√2"]);
	await expect(chances).toHaveText(["1/2", "1/2"]);

	await preset("|0⟩").click();
	await handle.focus();
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("ArrowUp");
	await expect(handle).toHaveAttribute("aria-valuenow", "30");
	await expect(handle).toHaveAttribute("aria-valuetext", "α = +0.87, β = +1/2");
	await expect(chances).toHaveText(["3/4", "1/4"]);

	await applyHadamard.click();
	await expect(handle).toHaveAttribute("aria-valuenow", "15");
	await expect(caption).toHaveText("α = +0.97, β = +0.26");
	await expect(amplitudes).toHaveText(["+0.97", "+0.26"]);
	await applyHadamard.click();
	await expect(caption).toHaveText("α = +0.87, β = +1/2");
	await expect(amplitudes).toHaveText(["+0.87", "+1/2"]);
	await expect(caption.locator("p")).toHaveCSS("position", "absolute");
});
