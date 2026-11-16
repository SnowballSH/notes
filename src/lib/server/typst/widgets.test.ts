import { describe, expect, it } from "vitest";
import { defineWidget } from "#lib/widgets/contract.ts";
import { TypstError } from "./cli";
import { assertValidWidgets, widgetProblems } from "./widgets";

const definitions = {
	dial: defineWidget({ props: { turns: { type: "integer", default: 1, min: 0, max: 3 } } }),
	plain: defineWidget({ props: {} }),
};

const placeholder = (name: string, props: Record<string, unknown> = {}): string =>
	`<notes-widget name="${name}" props='${JSON.stringify(props)}'>fallback</notes-widget>`;

describe("widgetProblems", () => {
	it("accepts registered widgets with props they take", () => {
		const html = `<p>Text</p>${placeholder("dial", { turns: 3 })}${placeholder("plain")}`;
		expect(widgetProblems(html, definitions)).toEqual([]);
	});

	it("names an unknown widget and lists the ones that exist", () => {
		expect(widgetProblems(placeholder("dail"), definitions)).toEqual([
			'unknown widget "dail"; the widgets are dial, plain',
		]);
	});

	it("names the widget and the prop it does not take", () => {
		expect(widgetProblems(placeholder("dial", { speed: 2 }), definitions)).toEqual([
			'widget "dial": unknown prop "speed"; it takes turns',
		]);
	});

	it("names the widget, the prop and what is allowed for a wrong type or range", () => {
		const html = placeholder("dial", { turns: "two" }) + placeholder("dial", { turns: 4 });
		expect(widgetProblems(html, definitions)).toEqual([
			'widget "dial": prop "turns" must be an integer from 0 to 3, not "two"',
			'widget "dial": prop "turns" must be an integer from 0 to 3, not 4',
		]);
	});

	it("checks the widgets of the site when given no others", () => {
		expect(widgetProblems(placeholder("hadamard-tiling", { start: 1, max: 6 }))).toEqual([]);
		expect(widgetProblems(placeholder("hadamard-tiling", { start: 7 }))).toEqual([
			'widget "hadamard-tiling": prop "start" must be an integer from 0 to 6, not 7',
		]);
	});
});

describe("assertValidWidgets", () => {
	it("passes a note whose widgets are valid", () => {
		expect(() =>
			assertValidWidgets(placeholder("dial"), "notes/a/b.typ", definitions),
		).not.toThrow();
	});

	it("fails with the file before every problem", () => {
		const html = placeholder("dail") + placeholder("dial", { turns: 9 });
		const attempt = () => assertValidWidgets(html, "notes/a/b.typ", definitions);
		expect(attempt).toThrow(TypstError);
		expect(attempt).toThrow(
			'notes/a/b.typ: unknown widget "dail"; the widgets are dial, plain\n' +
				'notes/a/b.typ: widget "dial": prop "turns" must be an integer from 0 to 3, not 9',
		);
	});
});
