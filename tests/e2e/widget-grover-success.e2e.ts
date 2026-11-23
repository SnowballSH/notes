import { expect, test } from "@playwright/test";
import { openWidget } from "./pages";

test("Grover's success probability peaks at the best count and falls with more queries", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "grover-success");
	const caption = widget.locator("figcaption .now");
	const spoken = widget.locator("figcaption .spoken");
	const qubits = widget.getByRole("slider", { name: "Number of qubits" });
	const queries = widget.getByRole("slider", { name: "Number of queries" });
	const moreMarked = widget.getByRole("button", { name: "More marked inputs" });

	await qubits.focus();
	await page.keyboard.press("Home");
	await expect(caption).toHaveText("t = 1, P = 1.000");
	await expect(spoken).toHaveText("N = 4, 1 query: Grover 1.000, classical at most 0.500.");
	await expect(moreMarked).toHaveAttribute("aria-disabled", "true");

	await page.keyboard.press("ArrowRight");
	await expect(widget.locator(".qubits .value")).toHaveText("n = 3");
	await expect(caption).toHaveText("t = 2, P = 0.945");
	await expect(spoken).toHaveText("N = 8, 2 queries: Grover 0.945, classical at most 0.375.");
	await expect(queries).toHaveAttribute("aria-valuenow", "2");
	await expect(queries).toHaveAttribute("aria-valuemax", "6");
	await expect(widget.locator(".best-label")).toHaveText("T = 2");
	await expect(widget.locator(".dot")).toHaveCount(7);
	await expect(widget.locator(".drop")).toHaveCount(0);
	await expect(widget.locator(".area")).toHaveCount(0);
	await expect(widget.locator("svg text").filter({ hasText: /^P$/ })).toHaveCount(1);

	await queries.focus();
	await page.keyboard.press("ArrowRight");
	await expect(widget.locator(".drop")).toHaveCount(1);
	await expect(caption).toHaveText("t = 3, P = 0.330");
	await expect(spoken).toHaveText("");
	await expect(queries).toHaveAttribute(
		"aria-valuetext",
		"N = 8, 3 queries: Grover 0.330, classical at most 0.500.",
	);
	await page.keyboard.press("ArrowRight");
	await expect(caption).toHaveText("t = 4, P = 0.012");
	await expect(queries).toHaveAttribute(
		"aria-valuetext",
		"N = 8, 4 queries: Grover 0.012, classical at most 0.625.",
	);
	await page.keyboard.press("Home");
	await expect(caption).toHaveText("t = 0, P = 0.125");
	await expect(queries).toHaveAttribute(
		"aria-valuetext",
		"N = 8, 0 queries: Grover 0.125, classical at most 0.125.",
	);
	await page.keyboard.press("ArrowRight");
	await expect(caption).toHaveText("t = 1, P = 0.781");
	await expect(spoken).toHaveText("");
	await expect(queries).toHaveAttribute(
		"aria-valuetext",
		"N = 8, 1 query: Grover 0.781, classical at most 0.250.",
	);

	await expect(widget.locator(".classical")).toHaveCount(1);
	const classicalLabel = widget.locator(".classical-label");
	await expect(classicalLabel).toHaveText("classical");
	const word = await classicalLabel.boundingBox();
	const lastDot = await widget.locator(".dot").last().boundingBox();
	if (!word || !lastDot) throw new Error("the plot is not laid out");
	expect(word.x + word.width).toBeLessThan(lastDot.x);
	const shownTextSize = await widget
		.locator(".tick")
		.first()
		.evaluate((tick) => {
			const picture = tick.closest("svg");
			if (!picture) throw new Error("the tick is outside the picture");
			const scale = picture.getBoundingClientRect().width / picture.viewBox.baseVal.width;
			return Number.parseFloat(getComputedStyle(tick).fontSize) * scale;
		});
	expect(shownTextSize).toBeGreaterThanOrEqual(11.9);
	await moreMarked.click();
	await expect(caption).toHaveText("t = 1, P = 1.000");
	await expect(spoken).toHaveText("N = 8, 2 marked, 1 query: Grover 1.000.");
	await expect(widget.locator(".classical")).toHaveCount(0);
	await expect(widget.locator(".classical-label")).toHaveCount(0);
	await expect(moreMarked).toHaveAttribute("aria-disabled", "true");
});

test("dragging across the plot chooses the number of queries under the pointer", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "grover-success");
	const caption = widget.locator("figcaption .now");
	const spoken = widget.locator("figcaption .spoken");
	const queries = widget.getByRole("slider", { name: "Number of queries" });
	const plot = widget.getByRole("group", { name: "Success probability of the search" });

	await widget.getByRole("slider", { name: "Number of qubits" }).focus();
	await page.keyboard.press("Home");
	await page.keyboard.press("ArrowRight");
	await expect(caption).toHaveText("t = 2, P = 0.945");
	const last = await queries.getAttribute("aria-valuemax");
	if (last === null) throw new Error("the chooser has no largest value");

	await plot.scrollIntoViewIfNeeded();
	const box = await plot.boundingBox();
	if (!box) throw new Error("the plot is not laid out");
	const middle = box.y + box.height / 2;
	const leftEdge = box.x + 1;
	const rightEdge = box.x + box.width - 1;

	await page.mouse.move(rightEdge, middle);
	await page.mouse.down();
	await expect(queries).toHaveAttribute("aria-valuenow", last);
	await expect(spoken).toHaveText("");

	await page.mouse.move(leftEdge, middle, { steps: 8 });
	await expect(queries).toHaveAttribute("aria-valuenow", "0");
	await expect(queries).toHaveAttribute(
		"aria-valuetext",
		"N = 8, 0 queries: Grover 0.125, classical at most 0.125.",
	);
	await expect(caption).toHaveText("t = 0, P = 0.125");

	await page.mouse.up();
	await page.mouse.move(rightEdge, middle, { steps: 4 });
	await expect(queries).toHaveAttribute("aria-valuenow", "0");
});
