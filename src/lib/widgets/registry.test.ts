import { describe, expect, it } from "vitest";
import { componentName, isWidgetName } from "./names";
import { componentPath, hasComponent, widgetDefinitions, widgetNames } from "./registry";
import { widgetUsage } from "./usage";

describe("widget names", () => {
	it("are lowercase words joined by hyphens, starting with a letter", () => {
		expect(["counter", "hadamard-tiling", "fft-2d"].filter(isWidgetName)).toHaveLength(3);
		expect(
			["", "Counter", "demo_counter", "demo--counter", "-demo", "demo-", "2d-fft", "a b"].filter(
				isWidgetName,
			),
		).toEqual([]);
	});

	it("name their component in PascalCase", () => {
		expect(componentName("counter")).toBe("Counter");
		expect(componentName("hadamard-tiling")).toBe("HadamardTiling");
		expect(componentName("fft-2d")).toBe("Fft2d");
	});
});

describe("the registry", () => {
	it("finds every widget directory", () => {
		expect(widgetNames).toEqual(expect.arrayContaining(["hadamard-tiling", "parity-explorer"]));
	});

	it.each(widgetNames)("has a valid name and a component for %s", (name) => {
		expect(isWidgetName(name)).toBe(true);
		expect(hasComponent(name), `${componentPath(name)} is missing`).toBe(true);
	});

	it("keeps the height a widget declares", () => {
		expect(widgetDefinitions["hadamard-tiling"]?.height).toBe(
			"calc(7.125rem + min(100vw - 2rem, 20rem + 2px))",
		);
	});
});

describe("widgetUsage", () => {
	const schema = widgetDefinitions["hadamard-tiling"]?.props ?? {};

	it("passes only the props that differ from their defaults", () => {
		expect(widgetUsage("hadamard-tiling", schema, { start: 2, max: 6 })).toBe(
			'#widget("hadamard-tiling", start: 2)[Fallback text.]',
		);
		expect(widgetUsage("hadamard-tiling", schema)).toBe(
			'#widget("hadamard-tiling")[Fallback text.]',
		);
	});

	it("writes text and booleans as Typst values", () => {
		const props = {
			label: { type: "text", default: "" },
			looping: { type: "boolean", default: false },
		} as const;
		expect(widgetUsage("demo", props, { label: 'say "hi"', looping: true })).toBe(
			'#widget("demo", label: "say \\"hi\\"", looping: true)[Fallback text.]',
		);
	});
});
