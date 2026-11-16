import { describe, expect, it } from "vitest";
import { defineWidget, resolveProps } from "./contract";
import { describeAllowed, propProblems } from "./props";

const schema = {
	level: { type: "integer", default: 1, min: 0, max: 6 },
	speed: { type: "number", default: 1, min: 0.25 },
	looping: { type: "boolean", default: false },
	label: { type: "text", default: "" },
	shape: { type: "choice", options: ["square", "circle"], default: "square" },
} as const;

describe("propProblems", () => {
	it("accepts values of the declared types, and a note that passes nothing", () => {
		expect(propProblems(schema, {})).toEqual([]);
		expect(
			propProblems(schema, { level: 6, speed: 2.5, looping: true, label: "a", shape: "circle" }),
		).toEqual([]);
	});

	it("names an unknown prop and the props the widget takes", () => {
		expect(propProblems(schema, { colour: "red" })).toEqual([
			'unknown prop "colour"; it takes level, speed, looping, label, shape',
		]);
		expect(propProblems({}, { colour: "red" })).toEqual([
			'unknown prop "colour"; it takes no props',
		]);
	});

	it("rejects a value of the wrong type and says what is allowed", () => {
		expect(propProblems(schema, { level: 1.5, looping: "yes", label: 3, shape: "star" })).toEqual([
			'prop "level" must be an integer from 0 to 6, not 1.5',
			'prop "looping" must be true or false, not "yes"',
			'prop "label" must be text, not 3',
			'prop "shape" must be one of "square", "circle", not "star"',
		]);
		expect(propProblems(schema, { level: "2", speed: null })).toEqual([
			'prop "level" must be an integer from 0 to 6, not "2"',
			'prop "speed" must be a number of at least 0.25, not null',
		]);
	});

	it("rejects a number out of range", () => {
		expect(propProblems(schema, { level: 7 })).toEqual([
			'prop "level" must be an integer from 0 to 6, not 7',
		]);
		expect(propProblems(schema, { speed: 0.1 })).toEqual([
			'prop "speed" must be a number of at least 0.25, not 0.1',
		]);
	});
});

describe("describeAllowed", () => {
	it("words each kind of range", () => {
		expect(describeAllowed({ type: "integer", default: 0 })).toBe("an integer");
		expect(describeAllowed({ type: "number", default: 0, max: 1 })).toBe("a number of at most 1");
	});
});

describe("resolveProps", () => {
	it("fills in the defaults a note left out", () => {
		expect(resolveProps(schema, { level: 3 })).toEqual({
			level: 3,
			speed: 1,
			looping: false,
			label: "",
			shape: "square",
		});
	});
});

describe("defineWidget", () => {
	it("refuses a default its own prop does not allow", () => {
		expect(() =>
			defineWidget({ props: { level: { type: "integer", default: 9, max: 6 } } }),
		).toThrow('prop "level" must be an integer of at most 6, not 9');
	});
});
