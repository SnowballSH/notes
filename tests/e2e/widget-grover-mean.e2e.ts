import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

/** What the widget shows for the all-ones marked input, by the number of qubits it was placed with. */
const expected: Record<
	number,
	{ start: string; queried: string[]; iterated: string[]; shown: string[] }
> = {
	2: {
		start: "1/4",
		queried: ["−1/2", "1/4", "1/4"],
		iterated: ["+1", "1"],
		shown: ["0.50", "−0.50", "1"],
	},
	3: {
		start: "1/8",
		queried: ["−1/√8", "1/8", "0.27"],
		iterated: ["+0.88", "0.78"],
		shown: ["0.35", "−0.35", "0.88"],
	},
};

test("one Grover iteration negates the marked amplitude and reflects every bar across the average", async ({
	page,
	request,
}) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="grover-mean"');
	} catch {
		test.skip(true, "no published note uses grover-mean yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="grover-mean"]').first();
	const caption = widget.locator("figcaption .shown");
	const spoken = widget.locator("figcaption .spoken");
	const query = widget.getByRole("button", { name: "Query", exact: true });
	const diffuse = widget.getByRole("button", { name: "Diffuse", exact: true });
	const startOver = widget.getByRole("button", { name: "Start over", exact: true });
	const inputs = widget.getByRole("radiogroup", { name: "Marked input" }).getByRole("radio");
	const markedColumn = widget.locator(".column.marked .spoken");
	const markedNumber = widget.locator(".column.marked .amplitude");

	const qubits = Math.log2(await inputs.count());
	const values = expected[qubits];
	if (!values) throw new Error(`the widget has ${await inputs.count()} inputs to mark`);
	const marked = "1".repeat(qubits);
	const [negated, chanceBefore, average] = values.queried;
	const [amplified, chanceAfter] = values.iterated;
	const [shownAtStart, shownNegated, shownAmplified] = values.shown;
	if (!shownAtStart || !shownNegated || !shownAmplified) throw new Error("no numbers to expect");

	await expect(widget.getByRole("list", { name: /^Amplitudes of the \d+ inputs/ })).toBeVisible();
	await inputs.last().check();
	await expect(widget.getByRole("radio", { name: marked, exact: true })).toBeChecked();
	await expect(caption).toHaveText(`P(${marked}) = ${values.start}`);
	await expect(markedNumber).toHaveText(shownAtStart);
	await expect(widget.getByText(marked, { exact: true })).toHaveCount(1);
	await expect(spoken).toHaveText(
		`Before any query, ${marked} is measured with probability ${values.start}.`,
	);
	await expect(query).not.toHaveAttribute("aria-disabled", "true");
	await expect(diffuse).toHaveAttribute("aria-disabled", "true");
	await expect(startOver).toHaveAttribute("aria-disabled", "true");

	await query.click();
	await expect(caption).toHaveText(`μ = ${average}`);
	await expect(spoken).toHaveText(
		`Query 1 negates the amplitude of ${marked}: the average μ is +${average}.`,
	);
	await expect(markedColumn).toHaveText(
		`${marked}: marked, amplitude ${negated}, probability ${chanceBefore}`,
	);
	await expect(markedNumber).toHaveText(shownNegated);
	await expect(query).toHaveAttribute("aria-disabled", "true");
	await expect(diffuse).not.toHaveAttribute("aria-disabled", "true");
	await expect(startOver).not.toHaveAttribute("aria-disabled", "true");

	await diffuse.click();
	await expect(caption).toHaveText(`P(${marked}) = ${chanceAfter}`);
	await expect(spoken).toHaveText(
		`After 1 iteration, ${marked} is measured with probability ${chanceAfter}.`,
	);
	await expect(markedColumn).toHaveText(
		`${marked}: marked, amplitude ${amplified}, probability ${chanceAfter}`,
	);
	await expect(markedNumber).toHaveText(shownAmplified);

	await inputs.first().check();
	await expect(caption).toHaveText(`P(${"0".repeat(qubits)}) = ${chanceAfter}`);
	await expect(markedColumn).toHaveText(
		`${"0".repeat(qubits)}: marked, amplitude ${amplified}, probability ${chanceAfter}`,
	);

	await startOver.click();
	await expect(caption).toHaveText(`P(${"0".repeat(qubits)}) = ${values.start}`);
	await expect(startOver).toHaveAttribute("aria-disabled", "true");
	await expect(query).not.toHaveAttribute("aria-disabled", "true");
	await expect(diffuse).toHaveAttribute("aria-disabled", "true");
});
