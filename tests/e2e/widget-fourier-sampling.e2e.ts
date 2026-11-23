import { expect, test } from "@playwright/test";
import { openWidget } from "./pages";

// AND leaves 1 − 2/N on 00…0 after the second layer of Hadamard gates.
const andAtZero: Record<number, string> = {
	2: "amplitude +1/2, probability 1/4",
	3: "amplitude +3/4, probability 9/16",
	4: "amplitude +7/8, probability 49/64",
};

test("Fourier sampling follows the truth table and tallies its measurements", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "fourier-sampling");
	const caption = widget.locator("figcaption .spoken");
	const preset = (name: string) => widget.getByRole("button", { name, exact: true });
	const sampled = widget
		.getByRole("list", { name: "Amplitudes and probabilities after H again" })
		.getByRole("listitem");
	const tally = widget.getByRole("list", { name: "Tally of outcomes" }).getByRole("listitem");
	const counts = widget.locator(".tally .count");

	const qubits = Math.log2(await sampled.count());
	const zeros = "0".repeat(qubits);
	const ones = "1".repeat(qubits);

	await expect(widget.locator(".symbol")).toHaveText(["f", "H", "query", "H again", "Pr"]);
	await expect(counts).toHaveCount(0);
	const chances = widget.locator(".chance");
	if (qubits <= 3) await expect(chances.first()).toHaveText(/^\d+(\/\d+)?$/);
	else await expect(chances.first()).toHaveText("");

	await preset("Parity").click();
	await expect(preset("Parity")).toHaveAttribute("aria-pressed", "true");
	await expect(caption).toHaveText(`The outcome is always ${ones}.`);
	await expect(sampled.last().locator(".spoken")).toHaveText(
		`${ones}: amplitude +1, probability 1`,
	);

	await preset("AND").click();
	await expect(sampled.first().locator(".spoken")).toHaveText(`${zeros}: ${andAtZero[qubits]}`);
	await expect(
		widget.getByRole("list", { name: "Amplitudes after the query" }).getByRole("listitem").last(),
	).toContainText(`${ones}: amplitude −`);

	await widget.getByRole("button", { name: `f of ${ones} = 1`, exact: true }).click();
	await expect(widget.getByRole("button", { name: `f of ${ones} = 0`, exact: true })).toBeVisible();
	await expect(preset("Constant 0")).toHaveAttribute("aria-pressed", "true");
	await expect(caption).toHaveText(`The outcome is always ${zeros}.`);

	const measure = widget.getByRole("button", { name: "Measure", exact: true });
	await measure.click();
	await measure.click();
	await measure.click();
	await expect(tally.first().locator(".spoken")).toHaveText(`${zeros}: 3`);
	await expect(tally.first().locator("[aria-hidden]")).toHaveText("3");
	await expect(tally.last().locator(".spoken")).toHaveText(`${ones}: 0`);
	await expect(tally.last().locator("[aria-hidden]")).toHaveCount(0);
	await expect(counts).toHaveCount(1);
	await expect(widget.getByText(`Measured ${zeros}: 3 of 3 so far.`)).toHaveCount(1);

	await preset("Balanced").click();
	await expect(tally.first().locator(".spoken")).toHaveText(`${zeros}: 0`);
	await expect(counts).toHaveCount(0);
	await expect(caption).toHaveText(`The outcome is always 1${"0".repeat(qubits - 1)}.`);
});
