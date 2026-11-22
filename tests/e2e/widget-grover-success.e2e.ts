import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

test("Grover's success probability peaks at the best count and falls with more queries", async ({
	page,
	request,
}) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="grover-success"');
	} catch {
		test.skip(true, "no published note uses grover-success yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="grover-success"]').first();
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

	await queries.focus();
	await page.keyboard.press("ArrowRight");
	await expect(widget.locator(".drop")).toHaveCount(1);
	await expect(caption).toHaveText("t = 3, P = 0.330");
	await expect(spoken).toHaveText("N = 8, 3 queries: Grover 0.330, classical at most 0.500.");
	await page.keyboard.press("ArrowRight");
	await expect(caption).toHaveText("t = 4, P = 0.012");
	await expect(spoken).toHaveText("N = 8, 4 queries: Grover 0.012, classical at most 0.625.");
	await page.keyboard.press("Home");
	await expect(caption).toHaveText("t = 0, P = 0.125");
	await expect(spoken).toHaveText("N = 8, 0 queries: Grover 0.125, classical at most 0.125.");
	await page.keyboard.press("ArrowRight");
	await expect(caption).toHaveText("t = 1, P = 0.781");
	await expect(spoken).toHaveText("N = 8, 1 query: Grover 0.781, classical at most 0.250.");
	await expect(queries).toHaveAttribute(
		"aria-valuetext",
		"N = 8, 1 query: Grover 0.781, classical at most 0.250.",
	);

	await expect(widget.locator(".classical")).toHaveCount(1);
	await expect(widget.locator(".classical-label")).toHaveText("classical");
	await expect(widget.locator(".legend")).toHaveCount(0);
	await moreMarked.click();
	await expect(caption).toHaveText("t = 1, P = 1.000");
	await expect(spoken).toHaveText("N = 8, 2 marked, 1 query: Grover 1.000.");
	await expect(widget.locator(".classical")).toHaveCount(0);
	await expect(widget.locator(".classical-label")).toHaveCount(0);
	await expect(moreMarked).toHaveAttribute("aria-disabled", "true");
});
