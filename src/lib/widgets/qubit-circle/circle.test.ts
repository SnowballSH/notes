import { describe, expect, it } from "vitest";
import { hadamardOnEveryQubit } from "../../quantum/state.ts";
import {
	describeState,
	keyedStep,
	namedStates,
	nearestStep,
	reflectStep,
	stateAt,
	stepsPerTurn,
	wrapStep,
} from "./circle.ts";

const stepNamed = (name: string): number => {
	const found = namedStates.find((state) => state.name === name);
	if (!found) throw new Error(`no state named ${name}`);
	return found.step;
};

describe("stateAt", () => {
	it("puts the four named states where the notes define them", () => {
		expect(stateAt(stepNamed("|0⟩"))).toEqual([1, 0]);
		expect(stateAt(stepNamed("|1⟩"))).toEqual([0, 1]);
		expect(stateAt(stepNamed("|+⟩"))[0]).toBeCloseTo(Math.SQRT1_2, 12);
		expect(stateAt(stepNamed("|+⟩"))[1]).toBeCloseTo(Math.SQRT1_2, 12);
		expect(stateAt(stepNamed("|−⟩"))[0]).toBeCloseTo(Math.SQRT1_2, 12);
		expect(stateAt(stepNamed("|−⟩"))[1]).toBeCloseTo(-Math.SQRT1_2, 12);
	});

	it("is a unit vector at every step", () => {
		for (let step = 0; step < stepsPerTurn; step++) {
			const [alpha = 0, beta = 0] = stateAt(step);
			expect(alpha ** 2 + beta ** 2).toBeCloseTo(1, 12);
		}
	});

	it("has amplitudes √3/2 and 1/2 a twelfth of a turn round", () => {
		expect(stateAt(4)[0]).toBeCloseTo(0.8660254, 6);
		expect(stateAt(4)[1]).toBeCloseTo(0.5, 12);
	});
});

describe("reflectStep", () => {
	it("sends |0⟩ to |+⟩ and |1⟩ to |−⟩, and back", () => {
		expect(reflectStep(0)).toBe(6);
		expect(reflectStep(12)).toBe(42);
		expect(reflectStep(6)).toBe(0);
		expect(reflectStep(42)).toBe(12);
	});

	it("fixes the two states on the mirror line", () => {
		expect(reflectStep(3)).toBe(3);
		expect(reflectStep(27)).toBe(27);
	});

	it("is an involution", () => {
		for (let step = 0; step < stepsPerTurn; step++) {
			expect(reflectStep(reflectStep(step))).toBe(step);
		}
	});

	it("agrees with the Hadamard matrix at every step", () => {
		for (let step = 0; step < stepsPerTurn; step++) {
			const reflected = stateAt(reflectStep(step));
			const transformed = hadamardOnEveryQubit(stateAt(step));
			expect(reflected[0]).toBeCloseTo(transformed[0] ?? Number.NaN, 12);
			expect(reflected[1]).toBeCloseTo(transformed[1] ?? Number.NaN, 12);
		}
	});
});

describe("wrapStep", () => {
	it("wraps round the circle in both directions", () => {
		expect(wrapStep(48)).toBe(0);
		expect(wrapStep(-6)).toBe(42);
		expect(wrapStep(100)).toBe(4);
	});
});

describe("nearestStep", () => {
	it("finds the named states from their directions", () => {
		expect(nearestStep(1, 0)).toBe(0);
		expect(nearestStep(1, 1)).toBe(6);
		expect(nearestStep(0, 2)).toBe(12);
		expect(nearestStep(-3, 0)).toBe(24);
		expect(nearestStep(1, -1)).toBe(42);
	});

	it("snaps to the nearer step", () => {
		expect(nearestStep(Math.cos(0.06), Math.sin(0.06))).toBe(0);
		expect(nearestStep(Math.cos(0.07), Math.sin(0.07))).toBe(1);
		expect(nearestStep(Math.cos(-0.07), Math.sin(-0.07))).toBe(47);
	});
});

describe("keyedStep", () => {
	it("steps by π/24 with the arrows and by π/4 with the page keys", () => {
		expect(keyedStep(0, "ArrowRight")).toBe(1);
		expect(keyedStep(0, "ArrowUp")).toBe(1);
		expect(keyedStep(0, "ArrowLeft")).toBe(47);
		expect(keyedStep(47, "ArrowUp")).toBe(0);
		expect(keyedStep(0, "PageUp")).toBe(6);
		expect(keyedStep(0, "PageDown")).toBe(42);
		expect(keyedStep(17, "Home")).toBe(0);
		expect(keyedStep(17, "End")).toBe(47);
	});

	it("ignores other keys", () => {
		expect(keyedStep(5, "a")).toBeUndefined();
		expect(keyedStep(5, "Tab")).toBeUndefined();
	});
});

describe("describeState", () => {
	it("names the amplitudes as the notes write them", () => {
		expect(describeState(stateAt(0))).toBe("α = +1, β = 0");
		expect(describeState(stateAt(6))).toBe("α = +1/√2, β = +1/√2");
		expect(describeState(stateAt(42))).toBe("α = +1/√2, β = −1/√2");
		expect(describeState(stateAt(12))).toBe("α = 0, β = +1");
		expect(describeState(stateAt(1))).toBe("α = +0.99, β = +0.13");
		expect(describeState(stateAt(20))).toBe("α = −0.87, β = +1/2");
	});
});
