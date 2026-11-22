import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

interface Expected {
	average: string;
	/** The spoken text of each Fourier column after its label, before D is applied. */
	coefficients: string[];
	afterDiffusion: string[];
	/** What the sliders of the first and the last amplitude say once D has been applied. */
	firstAmplitude: string;
	lastAmplitude: string;
}

/** What the widget shows for its default state, by the number of qubits it was placed with. */
const expected: Record<number, Expected> = {
	2: {
		average: "1/4",
		coefficients: [
			"00: highlighted, amplitude +1/2, probability 1/4",
			"01: amplitude +1/2, probability 1/4",
			"10: amplitude +1/2, probability 1/4",
			"11: amplitude −1/2, probability 1/4",
		],
		afterDiffusion: [
			"00: highlighted, amplitude +1/2, probability 1/4",
			"01: amplitude −1/2, probability 1/4",
			"10: amplitude −1/2, probability 1/4",
			"11: amplitude +1/2, probability 1/4",
		],
		firstAmplitude: "amplitude 0, probability 0",
		lastAmplitude: "amplitude +1, probability 1",
	},
	3: {
		average: "0.27",
		coefficients: [
			"000: highlighted, amplitude +3/4, probability 0.56",
			"001: amplitude +1/4, probability 0.06",
			"010: amplitude +1/4, probability 0.06",
			"011: amplitude −1/4, probability 0.06",
			"100: amplitude +1/4, probability 0.06",
			"101: amplitude −1/4, probability 0.06",
			"110: amplitude −1/4, probability 0.06",
			"111: amplitude +1/4, probability 0.06",
		],
		afterDiffusion: [
			"000: highlighted, amplitude +3/4, probability 0.56",
			"001: amplitude −1/4, probability 0.06",
			"010: amplitude −1/4, probability 0.06",
			"011: amplitude +1/4, probability 0.06",
			"100: amplitude −1/4, probability 0.06",
			"101: amplitude +1/4, probability 0.06",
			"110: amplitude +1/4, probability 0.06",
			"111: amplitude −1/4, probability 0.06",
		],
		firstAmplitude: "amplitude +0.18, probability 0.03",
		lastAmplitude: "amplitude +0.88, probability 0.78",
	},
};

test("D keeps the Fourier coefficient at zero, negates the others, and undoes itself", async ({
	page,
	request,
}) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="diffusion-fourier"');
	} catch {
		test.skip(true, "no published note uses diffusion-fourier yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="diffusion-fourier"]').first();
	const applyD = widget.getByRole("button", { name: "Apply D", exact: true });
	const startOver = widget.getByRole("button", { name: "Start over", exact: true });
	const amplitudes = widget
		.getByRole("group", { name: "Amplitudes of the state, drawable" })
		.getByRole("slider");
	const coefficients = widget
		.getByRole("list", { name: "Fourier coefficients of the amplitudes, times √N" })
		.locator(".spoken");

	const qubits = Math.log2(await amplitudes.count());
	const values = expected[qubits];
	if (!values) throw new Error(`the widget has ${await amplitudes.count()} amplitudes`);
	const average = widget.getByText(`μ = ${values.average}`, { exact: true });
	const spokenAverage = widget.getByText(`The average amplitude is ${values.average}.`);

	await expect(average).toBeVisible();
	await expect(spokenAverage).toBeAttached();
	await expect(widget.getByText("draw", { exact: true })).toHaveCount(0);
	await expect(widget.getByText("average", { exact: true })).toHaveCount(0);
	await expect(coefficients).toHaveText(values.coefficients);
	await expect(startOver).toHaveAttribute("aria-disabled", "true");

	await applyD.click();
	await expect(coefficients).toHaveText(values.afterDiffusion);
	await expect(amplitudes.first()).toHaveAttribute("aria-valuetext", values.firstAmplitude);
	await expect(amplitudes.last()).toHaveAttribute("aria-valuetext", values.lastAmplitude);
	await expect(average).toBeVisible();
	await expect(startOver).not.toHaveAttribute("aria-disabled", "true");

	await applyD.click();
	await expect(coefficients).toHaveText(values.coefficients);
	await expect(startOver).toHaveAttribute("aria-disabled", "true");
});

test("a state edited from the keyboard moves the average, and Start over restores it", async ({
	page,
	request,
}) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="diffusion-fourier"');
	} catch {
		test.skip(true, "no published note uses diffusion-fourier yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="diffusion-fourier"]').first();
	const amplitudes = widget
		.getByRole("group", { name: "Amplitudes of the state, drawable" })
		.getByRole("slider");
	const coefficients = widget
		.getByRole("list", { name: "Fourier coefficients of the amplitudes, times √N" })
		.locator(".spoken");
	const count = await amplitudes.count();
	const values = expected[Math.log2(count)];
	if (!values) throw new Error(`the widget has ${count} amplitudes`);
	const uniform = { 4: "1/2", 8: "0.35" }[count];

	// Negating the one negative amplitude gives the uniform superposition, which D leaves alone.
	await amplitudes.last().focus();
	await page.keyboard.press("Enter");
	await expect(widget.getByText(`μ = ${uniform}`, { exact: true })).toBeVisible();
	await expect(coefficients.first()).toHaveText(/: highlighted, amplitude \+1, probability 1$/);
	await expect(coefficients.last()).toHaveText(/: amplitude 0, probability 0$/);

	await widget.getByRole("button", { name: "Apply D", exact: true }).click();
	await expect(coefficients.first()).toHaveText(/: highlighted, amplitude \+1, probability 1$/);
	await expect(amplitudes.last()).toHaveAttribute(
		"aria-valuetext",
		count === 4 ? "amplitude +1/2, probability 1/4" : "amplitude +1/√8, probability 1/8",
	);

	await widget.getByRole("button", { name: "Start over", exact: true }).click();
	await expect(coefficients).toHaveText(values.coefficients);
	await expect(widget.getByText(`μ = ${values.average}`, { exact: true })).toBeVisible();
});
