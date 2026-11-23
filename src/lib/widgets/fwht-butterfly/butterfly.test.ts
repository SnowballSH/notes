import { describe, expect, it } from "vitest";
import { walshHadamard } from "../../quantum/fourier";
import {
	allWires,
	butterflyColumns,
	butterflyInto,
	columnName,
	defaultInput,
	describeInput,
	describeLevel,
	equation,
	levels,
	movedNode,
	nodeLabel,
	randomValues,
	wiresInto,
} from "./butterfly";

/** The loop of the note, keeping a copy of the array after each value of half. */
function loopSnapshots(input: readonly number[]): number[][] {
	const f = [...input];
	const size = f.length;
	const snapshots = [[...f]];
	for (let half = 1; half < size; half *= 2) {
		for (let start = 0; start < size; start += 2 * half) {
			for (let j = start; j < start + half; j++) {
				const u = f[j] ?? 0;
				const v = f[j + half] ?? 0;
				f[j] = u + v;
				f[j + half] = u - v;
			}
		}
		snapshots.push([...f]);
	}
	return snapshots;
}

describe("butterflyColumns", () => {
	it("gives the default input level by level", () => {
		expect(levels).toBe(3);
		expect(butterflyColumns(defaultInput)).toEqual([
			[1, 1, 1, -1, 1, -1, -1, -1],
			[2, 0, 0, 2, 0, 2, -2, 0],
			[2, 2, 2, -2, -2, 2, 2, 2],
			[0, 4, 4, 0, 4, 0, 0, -4],
		]);
	});

	it("matches the loop of the note after every level", () => {
		for (const input of [defaultInput, [3, -3, 2, 0, -1, 1, -2, 3], [0, 0, 0, 1], [2, -3]])
			expect(butterflyColumns(input)).toEqual(loopSnapshots(input));
	});

	it("ends with the Walsh-Hadamard matrix times the input", () => {
		for (const input of [
			defaultInput,
			[3, -3, 2, 0, -1, 1, -2, 3],
			[-3, -3, -3, -3, -3, -3, -3, -3],
		])
			expect(butterflyColumns(input).at(-1)).toEqual(walshHadamard(input));
		expect(butterflyColumns([-3, -3, -3, -3, -3, -3, -3, -3]).at(-1)?.[0]).toBe(-24);
	});
});

describe("butterflyInto", () => {
	it("adds into the upper entry of a pair and subtracts into the lower", () => {
		expect(butterflyInto({ level: 1, index: 0 })).toEqual({ upper: 0, lower: 1, sign: 1 });
		expect(butterflyInto({ level: 1, index: 1 })).toEqual({ upper: 0, lower: 1, sign: -1 });
		expect(butterflyInto({ level: 2, index: 5 })).toEqual({ upper: 5, lower: 7, sign: 1 });
		expect(butterflyInto({ level: 3, index: 7 })).toEqual({ upper: 3, lower: 7, sign: -1 });
	});
});

describe("wires", () => {
	it("puts the minus on the line from the lower entry to itself", () => {
		expect(wiresInto({ level: 2, index: 3 })).toEqual([
			{ level: 2, from: 1, to: 3, sign: 1 },
			{ level: 2, from: 3, to: 3, sign: -1 },
		]);
		expect(wiresInto({ level: 2, index: 1 })).toEqual([
			{ level: 2, from: 1, to: 1, sign: 1 },
			{ level: 2, from: 3, to: 1, sign: 1 },
		]);
	});

	it("draws two lines into each of the 24 computed entries, a quarter of them minus", () => {
		const wires = allWires(8);
		expect(wires).toHaveLength(48);
		expect(wires.filter((wire) => wire.sign === -1)).toHaveLength(12);
		expect(wires.filter((wire) => wire.sign === -1).every((wire) => wire.from === wire.to)).toBe(
			true,
		);
	});
});

describe("wording", () => {
	const columns = butterflyColumns(defaultInput);

	it("names columns and entries", () => {
		expect([0, 1, 2, 3].map(columnName)).toEqual(["input", "half = 1", "half = 2", "half = 4"]);
		expect(nodeLabel({ level: 0, index: 3 }, -1)).toBe("Input, f[3] = −1");
		expect(nodeLabel({ level: 3, index: 7 }, -4)).toBe("After half = 4, f[7] = −4");
	});

	it("describes each level", () => {
		expect(describeLevel(0)).toBe("Level 0 of 3: the input.");
		expect(describeLevel(2)).toBe("After level 2 of 3: blocks of size 4 are transformed.");
		expect(describeLevel(3)).toBe("After level 3 of 3: blocks of size 8 are transformed.");
	});

	it("lists the input values", () => {
		expect(describeInput(defaultInput)).toBe("Input: 1, 1, 1, −1, 1, −1, −1, −1.");
		expect(describeInput([3, -2, 0])).toBe("Input: 3, −2, 0.");
	});

	it("writes out the line that set an entry", () => {
		expect(equation(columns, { level: 0, index: 3 })).toBe("f[3] = −1");
		expect(equation(columns, { level: 1, index: 0 })).toBe("f[0] = f[0] + f[1] = 1 + 1 = 2");
		expect(equation(columns, { level: 3, index: 4 })).toBe("f[4] = f[0] − f[4] = 2 − (−2) = 4");
		expect(equation(columns, { level: 3, index: 7 })).toBe("f[7] = f[3] − f[7] = −2 − 2 = −4");
		expect(equation(columns, { level: 3, index: 0 })).toBe("f[0] = f[0] + f[4] = 2 + (−2) = 0");
	});
});

describe("movedNode", () => {
	it("moves within the computed entries and stops at their edges", () => {
		expect(movedNode({ level: 1, index: 2 }, "ArrowDown", 2, 8)).toEqual({ level: 1, index: 3 });
		expect(movedNode({ level: 1, index: 0 }, "ArrowUp", 2, 8)).toEqual({ level: 1, index: 0 });
		expect(movedNode({ level: 1, index: 7 }, "ArrowDown", 2, 8)).toEqual({ level: 1, index: 7 });
		expect(movedNode({ level: 1, index: 2 }, "ArrowRight", 2, 8)).toEqual({ level: 2, index: 2 });
		expect(movedNode({ level: 2, index: 2 }, "ArrowRight", 2, 8)).toEqual({ level: 2, index: 2 });
		expect(movedNode({ level: 0, index: 2 }, "ArrowLeft", 2, 8)).toEqual({ level: 0, index: 2 });
	});

	it("ignores other keys", () => {
		expect(movedNode({ level: 1, index: 2 }, "a", 3, 8)).toBeUndefined();
		expect(movedNode({ level: 1, index: 2 }, "Tab", 3, 8)).toBeUndefined();
	});
});

describe("randomValues", () => {
	it("maps the random source evenly onto the integers from −3 to 3", () => {
		const points = [0, 0.142, 0.143, 0.5, 0.857, 0.858, 0.999999, 0.3];
		expect(randomValues(() => points.shift() ?? 0, 8)).toEqual([-3, -3, -2, 0, 2, 3, 3, -1]);
	});
});
