import { expect, test } from "@playwright/test";
import { pageWith } from "./pages";

test("the circuit diagram draws its gates in order and reads them out", async ({
	page,
	request,
}) => {
	let path: string;
	try {
		path = await pageWith(request, 'name="circuit"');
	} catch {
		test.skip(true, "no published note uses circuit yet");
		return;
	}
	await page.goto(path, { waitUntil: "networkidle" });
	const widget = page.locator('notes-widget[name="circuit"]').first();
	const circuit = widget.getByRole("img", { name: /^Circuit on n qubits, each starting in \|0⟩/ });
	const toggle = widget.getByRole("button", { name: "Expand D", exact: true });

	await expect(circuit).toBeVisible();
	await expect(circuit.locator(".lead")).toHaveText(["|0⟩", "|0⟩", "|0⟩"]);
	await expect(circuit.locator(".meter")).toHaveCount(3);
	await expect(circuit.locator(".gate.query .name")).toHaveText("O±f");

	if ((await toggle.count()) === 0) {
		await expect(circuit).toHaveAttribute(
			"aria-label",
			"Circuit on n qubits, each starting in |0⟩: a Hadamard gate on every qubit, then one query to the sign oracle of f, then a Hadamard gate on every qubit, then every qubit is measured.",
		);
		await expect(circuit.locator(".gate .name")).toHaveText(["H⊗n", "O±f", "H⊗n"]);
		return;
	}

	await expect(circuit).toHaveAttribute(
		"aria-label",
		"Circuit on n qubits, each starting in |0⟩: a Hadamard gate on every qubit, then T repetitions of the sign oracle of f followed by the diffusion gate D, then every qubit is measured.",
	);
	await expect(circuit.locator(".gate .name")).toHaveText(["H⊗n", "O±f", "D"]);
	await expect(circuit.locator(".repeat")).toHaveText("× T");

	const diffusion = widget.getByRole("img", { name: /^The diffusion gate D on n qubits/ });
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(diffusion).toHaveCount(0);

	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-expanded", "true");
	await expect(diffusion.locator(".lead")).toHaveText("D =");
	await expect(diffusion.locator(".gate .name")).toHaveText(["H⊗n", "Z0", "H⊗n"]);
	await expect(diffusion.locator(".meter")).toHaveCount(0);

	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(diffusion).toHaveCount(0);
});
