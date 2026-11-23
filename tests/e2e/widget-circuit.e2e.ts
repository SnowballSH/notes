import { expect, test } from "@playwright/test";
import { openWidget, type PlacedProps } from "./pages";

const picture = /^Circuit on n qubits, each starting in \|0⟩/;
const isGrover = ({ kind }: PlacedProps): boolean => kind === "grover";

test("the Fourier sampling circuit draws its gates in order and reads them out", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "circuit", (props) => !isGrover(props));
	const circuit = widget.getByRole("img", { name: picture });

	await expect(circuit).toBeVisible();
	await expect(circuit).toHaveAttribute(
		"aria-label",
		"Circuit on n qubits, each starting in |0⟩: a Hadamard gate on every qubit, then one query to the sign oracle of f, then a Hadamard gate on every qubit, then every qubit is measured.",
	);
	await expect(circuit.locator(".lead")).toHaveText(["|0⟩", "|0⟩", "|0⟩"]);
	await expect(circuit.locator(".meter")).toHaveCount(3);
	await expect(circuit.locator(".gate .name")).toHaveText(["H⊗n", "O±f", "H⊗n"]);
	await expect(circuit.locator(".gate.query .name")).toHaveText("O±f");
	await expect(circuit.locator(".name").first()).toHaveCSS("font-family", /STIX Two Math/);
	await expect(widget.getByRole("button")).toHaveCount(0);
});

test("the Grover circuit repeats its pair of gates and expands D on request", async ({
	page,
	request,
}) => {
	const widget = await openWidget(page, request, "circuit", isGrover);
	const circuit = widget.getByRole("img", { name: picture });
	const toggle = widget.getByRole("button", { name: /^(Expand|Hide) D$/ });
	const diffusion = widget.getByRole("img", { name: /^The diffusion gate D on n qubits/ });

	await expect(circuit).toHaveAttribute(
		"aria-label",
		"Circuit on n qubits, each starting in |0⟩: a Hadamard gate on every qubit, then T repetitions of the sign oracle of f followed by the diffusion gate D, then every qubit is measured.",
	);
	await expect(circuit.locator(".lead")).toHaveText(["|0⟩", "|0⟩", "|0⟩"]);
	await expect(circuit.locator(".meter")).toHaveCount(3);
	await expect(circuit.locator(".gate .name")).toHaveText(["H⊗n", "O±f", "D"]);
	await expect(circuit.locator(".gate.query .name")).toHaveText("O±f");
	await expect(circuit.locator(".repeat")).toHaveText("× T");

	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(toggle).toHaveText("Expand D");
	await expect(diffusion).toHaveCount(0);

	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-expanded", "true");
	await expect(toggle).toHaveText("Hide D");
	await expect(diffusion.locator(".lead")).toHaveText("D =");
	await expect(diffusion.locator(".gate .name")).toHaveText(["H⊗n", "Z0", "H⊗n"]);
	await expect(diffusion.locator(".meter")).toHaveCount(0);

	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(toggle).toHaveText("Expand D");
	await expect(diffusion).toHaveCount(0);
});
