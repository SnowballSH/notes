import { expect, test } from "@playwright/test";
import { openWidget } from "./pages";

test("the Hadamard gate reflects a qubit on the circle, and twice returns it", async ({
	page,
	request,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	const widget = await openWidget(page, request, "qubit-circle");
	const caption = widget.locator("figcaption");
	const applyHadamard = widget.getByRole("button", { name: "Apply H" });
	const preset = (name: string) => widget.getByRole("button", { name, exact: true });
	const handle = widget.getByRole("slider", { name: "Angle of the state" });
	const amplitudes = widget.locator(".amplitude");
	const chances = widget.locator(".chance-value");

	await expect(widget.locator(".symbols span")).toHaveText(["α", "β"]);
	await expect(widget.locator(".bars .label")).toHaveText(["|0⟩", "|1⟩"]);
	await expect(widget.locator(".chance").first()).toBeHidden();
	await expect(
		widget.getByRole("list", { name: "Amplitudes and measurement probabilities" }),
	).toContainText("|0⟩: amplitude +1, probability 1");

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
	await expect(widget.locator(".symbols .negative")).toHaveText("β");
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

test("dragging the handle turns the state to the direction of the pointer", async ({
	page,
	request,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	const widget = await openWidget(page, request, "qubit-circle");
	const circle = widget.getByRole("group", { name: "Qubit state on the unit circle" });
	const handle = widget.getByRole("slider", { name: "Angle of the state" });
	const chart = widget.getByRole("list", { name: "Amplitudes and measurement probabilities" });

	await widget.getByRole("button", { name: "|0⟩", exact: true }).click();
	await expect(handle).toHaveAttribute("aria-valuenow", "0");

	await circle.scrollIntoViewIfNeeded();
	const box = await circle.boundingBox();
	const knob = await handle.locator(".knob").boundingBox();
	if (!box || !knob) throw new Error("the circle is not laid out");
	const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
	const reach = Math.min(box.width, box.height) / 2 - 2;

	await page.mouse.move(knob.x + knob.width / 2, knob.y + knob.height / 2);
	await page.mouse.down();
	await page.mouse.move(centre.x, centre.y - reach, { steps: 8 });
	await expect(handle).toHaveAttribute("aria-valuenow", "90");
	await expect(handle).toHaveAttribute("aria-valuetext", "α = 0, β = +1");
	await expect(chart).toContainText("|1⟩: amplitude +1, probability 1");
	await expect(widget.locator("figcaption")).toHaveText("");

	await page.mouse.move(centre.x - reach, centre.y, { steps: 8 });
	await expect(handle).toHaveAttribute("aria-valuenow", "180");
	await expect(handle).toHaveAttribute("aria-valuetext", "α = −1, β = 0");

	await page.mouse.move(centre.x, centre.y + reach, { steps: 8 });
	await expect(handle).toHaveAttribute("aria-valuenow", "270");
	await expect(handle).toHaveAttribute("aria-valuetext", "α = 0, β = −1");

	await page.mouse.up();
	await page.mouse.move(centre.x + reach, centre.y, { steps: 4 });
	await expect(handle).toHaveAttribute("aria-valuenow", "270");
});
