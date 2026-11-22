import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

test("the roadmap links its published sections and ends at Grover's algorithm", async ({
	page,
	request,
}) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="roadmap"');
	} catch (error) {
		if (!(error instanceof Error && error.message.includes("no page of the site contains"))) {
			throw error;
		}
		test.skip(true, "no published note uses roadmap yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="roadmap"]').first();
	const sections = widget.getByRole("list", { name: "Course roadmap" }).getByRole("listitem");

	await expect(sections).toHaveCount(7);
	await expect(
		sections.nth(0).getByRole("link", { name: "2.1 Boolean functions and Fourier expansions" }),
	).toHaveAttribute("href", "/walsh-hadamard/boolean-functions");

	const planned = sections.filter({ hasText: "Classical applications" });
	await expect(planned).toHaveText(/^2\.4\s+Classical applications\s*, needs 2\.1 and 2\.3$/);
	await expect(planned.getByRole("link")).toHaveCount(0);

	await expect(sections.last()).toContainText("4.1 Grover's algorithm");
});
