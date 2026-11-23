import { expect, it, describe as suite } from "vitest";
import { groverAngle } from "../../quantum/grover.ts";
import {
	angleMultiple,
	caption,
	chanceLabel,
	clampMarked,
	describe,
	describePicture,
	formatProbability,
	lastIteration,
	mostMarked,
	stateAngle,
	turnLabel,
} from "./rotation.ts";

suite("mostMarked and clampMarked", () => {
	it("allows a quarter of the inputs", () => {
		expect(mostMarked(2)).toBe(1);
		expect(mostMarked(3)).toBe(2);
		expect(mostMarked(8)).toBe(64);
	});

	it("clamps the marked count into range", () => {
		expect(clampMarked(5, 3)).toBe(2);
		expect(clampMarked(2, 3)).toBe(2);
		expect(clampMarked(0, 3)).toBe(1);
		expect(clampMarked(3, 2)).toBe(1);
	});
});

suite("stateAngle", () => {
	it("starts at θ and turns by 2θ each iteration", () => {
		expect(stateAngle(8, 1, 0)).toBeCloseTo(0.36137, 5);
		expect(stateAngle(8, 1, 1)).toBeCloseTo(1.0841, 5);
		expect(stateAngle(8, 1, 2)).toBeCloseTo(1.80684, 5);
		expect(stateAngle(4, 1, 1)).toBeCloseTo(Math.PI / 2, 12);
	});
});

suite("lastIteration", () => {
	it("is the state nearest the negative unmarked axis, under it or over it", () => {
		expect(lastIteration(8, 1)).toBe(4);
		expect(lastIteration(256, 1)).toBe(25);
		expect(lastIteration(16, 3)).toBe(3);
		expect(lastIteration(32, 7)).toBe(3);
	});

	it("is the earlier of two states equally near that axis", () => {
		expect(lastIteration(4, 1)).toBe(2);
		expect(lastIteration(8, 2)).toBe(2);
		expect(lastIteration(256, 64)).toBe(2);
	});

	it("is within θ of the half turn, and nearer to it than its neighbours, for every setting", () => {
		for (let qubits = 2; qubits <= 8; qubits++) {
			for (let marked = 1; marked <= mostMarked(qubits); marked++) {
				const size = 2 ** qubits;
				const last = lastIteration(size, marked);
				const away = (iterations: number): number =>
					Math.abs(stateAngle(size, marked, iterations) - Math.PI);
				expect(away(last)).toBeLessThanOrEqual(groverAngle(size, marked) + 1e-9);
				expect(away(last - 1)).toBeGreaterThan(away(last));
				expect(away(last + 1)).toBeGreaterThanOrEqual(away(last) - 1e-9);
			}
		}
	});
});

suite("labels", () => {
	it("writes the angle as an odd multiple of θ", () => {
		expect(angleMultiple(0)).toBe("θ");
		expect(angleMultiple(1)).toBe("3θ");
		expect(angleMultiple(12)).toBe("25θ");
	});

	it("labels the arc θ at the start and 2θ after an iteration", () => {
		expect(turnLabel(0)).toBe("θ");
		expect(turnLabel(3)).toBe("2θ");
	});

	it("writes a probability to three places unless it is exactly 0 or 1", () => {
		expect(formatProbability(0.125)).toBe("0.125");
		expect(formatProbability(0.9453125)).toBe("0.945");
		expect(formatProbability(0.25)).toBe("0.250");
		expect(formatProbability(1 - 1e-12)).toBe("1");
		expect(formatProbability(0.99995)).toBe("1.000");
	});
});

suite("caption", () => {
	it("gives the number of inputs and the iteration count", () => {
		expect(caption(3, 0)).toBe("N = 8, t = 0");
		expect(caption(3, 4)).toBe("N = 8, t = 4");
		expect(caption(8, 12)).toBe("N = 256, t = 12");
	});
});

suite("chanceLabel", () => {
	it("names the probability written under the square", () => {
		expect(chanceLabel(0.78125)).toBe("P = 0.781");
		expect(chanceLabel(0.01171875)).toBe("P = 0.012");
		expect(chanceLabel(1)).toBe("P = 1");
	});
});

suite("describe", () => {
	it("follows eight inputs up to the best count and past it", () => {
		expect(describe(3, 1, 0)).toBe("N = 8, t = 0 of T = 2: angle θ ≈ 0.36, probability 0.125.");
		expect(describe(3, 1, 1)).toBe("N = 8, t = 1 of T = 2: angle 3θ ≈ 1.08, probability 0.781.");
		expect(describe(3, 1, 2)).toBe("N = 8, t = 2 of T = 2: angle 5θ ≈ 1.81, probability 0.945.");
		expect(describe(3, 1, 3)).toBe("N = 8, t = 3 of T = 2: angle 7θ ≈ 2.53, probability 0.330.");
		expect(describe(3, 1, 4)).toBe("N = 8, t = 4 of T = 2: angle 9θ ≈ 3.25, probability 0.012.");
	});

	it("reaches the marked axis exactly with four inputs", () => {
		expect(describe(2, 1, 0)).toBe("N = 4, t = 0 of T = 1: angle θ ≈ 0.52, probability 0.250.");
		expect(describe(2, 1, 1)).toBe("N = 4, t = 1 of T = 1: angle 3θ ≈ 1.57, probability 1.");
		expect(describe(2, 1, 2)).toBe("N = 4, t = 2 of T = 1: angle 5θ ≈ 2.62, probability 0.250.");
	});

	it("counts twelve iterations for one marked input of 256", () => {
		expect(describe(8, 1, 12)).toBe(
			"N = 256, t = 12 of T = 12: angle 25θ ≈ 1.56, probability 1.000.",
		);
	});
});

suite("describePicture", () => {
	it("gives the height and its square", () => {
		expect(describePicture(3, 1, 2)).toContain(
			"The state after 2 iterations is the arrow at angle 5θ, of height 0.97; the square on that height has area 0.945,",
		);
		expect(describePicture(3, 1, 2)).toContain("The best count T = 2 is ticked on the circle.");
	});

	it("gives a negative height once the arrow is under the unmarked axis", () => {
		expect(describePicture(3, 1, 4)).toContain(
			"The state after 4 iterations is the arrow at angle 9θ, of height -0.11; the square on that height has area 0.012,",
		);
	});
});
