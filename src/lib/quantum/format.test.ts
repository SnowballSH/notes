import { describe, expect, it } from "vitest";
import { formatAmplitude, formatDyadic, ket, listAmplitudes } from "./format";

describe("formatDyadic", () => {
	it("writes a fraction over a power of two in lowest terms", () => {
		expect(formatDyadic(0)).toBe("0");
		expect(formatDyadic(1)).toBe("1");
		expect(formatDyadic(0.5)).toBe("1/2");
		expect(formatDyadic(0.125)).toBe("1/8");
		expect(formatDyadic(0.75)).toBe("3/4");
		expect(formatDyadic(Math.SQRT1_2 ** 2)).toBe("1/2");
	});

	it("falls back to decimals", () => {
		expect(formatDyadic(1 / 3)).toBe("0.33");
		expect(formatDyadic(1 / 64)).toBe("0.02");
	});
});

describe("formatAmplitude", () => {
	it("keeps the sign and the square root", () => {
		expect(formatAmplitude(Math.SQRT1_2)).toBe("+1/√2");
		expect(formatAmplitude(-Math.SQRT1_2)).toBe("−1/√2");
		expect(formatAmplitude(-0.5)).toBe("−1/2");
		expect(formatAmplitude(8 ** -0.5)).toBe("+1/√8");
		expect(formatAmplitude(-0.25)).toBe("−1/4");
		expect(formatAmplitude(1)).toBe("+1");
	});

	it("gives zero no sign, even when rounding left a trace", () => {
		expect(formatAmplitude(0)).toBe("0");
		expect(formatAmplitude(-1e-17)).toBe("0");
	});

	it("falls back to decimals", () => {
		expect(formatAmplitude(-0.6)).toBe("−0.60");
		expect(formatAmplitude(32 ** -0.5)).toBe("+0.18");
		expect(formatAmplitude(1 / 16)).toBe("+0.06");
	});
});

describe("values that round to a whole number", () => {
	it.each([1e-9, 1e-6, 0.0005, 0.0049])("shows ±%f as an unsigned zero", (magnitude) => {
		expect(formatAmplitude(magnitude)).toBe("0");
		expect(formatAmplitude(-magnitude)).toBe("0");
		expect(formatDyadic(magnitude)).toBe("0");
	});

	it("keeps the sign of the smallest value that does not round to zero", () => {
		expect(formatAmplitude(0.0051)).toBe("+0.01");
		expect(formatAmplitude(-0.0051)).toBe("−0.01");
	});

	it.each([0.9951, 0.9999999, 1 - 1e-12])("shows %f as 1, like an exact 1", (magnitude) => {
		expect(formatAmplitude(magnitude)).toBe("+1");
		expect(formatAmplitude(-magnitude)).toBe("−1");
		expect(formatDyadic(magnitude)).toBe("1");
	});

	it("keeps two decimals just below that", () => {
		expect(formatAmplitude(0.9949)).toBe("+0.99");
	});
});

describe("listAmplitudes", () => {
	it("names the amplitudes that are not shown as zero", () => {
		expect(listAmplitudes(["00", "01", "10", "11"], [Math.SQRT1_2, 0, -1e-4, -Math.SQRT1_2])).toBe(
			"00 +1/√2, 11 −1/√2",
		);
	});
});

describe("ket", () => {
	it("wraps a label", () => {
		expect(ket("01")).toBe("|01⟩");
	});
});
