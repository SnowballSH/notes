export const minusSign = "−";
const root = "√";
const tolerance = 1e-9;
const largestDenominatorExponent = 3;
const largestRootExponent = 3;

const isWhole = (value: number): boolean => Math.abs(value - Math.round(value)) < tolerance;

function reduced(numerator: number, exponent: number): string {
	let top = numerator;
	let power = exponent;
	while (power > 0 && top % 2 === 0) {
		top /= 2;
		power -= 1;
	}
	return power === 0 ? String(top) : `${top}/${2 ** power}`;
}

/** A non-negative number as a fraction over a small power of two when it is one, else as a decimal. */
export function formatDyadic(value: number): string {
	for (let exponent = 0; exponent <= largestDenominatorExponent; exponent++) {
		const numerator = value * 2 ** exponent;
		if (isWhole(numerator)) return reduced(Math.round(numerator), exponent);
	}
	const rounded = Number(value.toFixed(2));
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function formatMagnitude(magnitude: number): string {
	if (magnitude < tolerance) return "0";
	const square = magnitude ** 2;
	const halvings = Math.log2(1 / square);
	const isRootOfPowerOfTwo =
		isWhole(halvings) && Math.round(halvings) % 2 === 1 && halvings < largestRootExponent + 0.5;
	return isRootOfPowerOfTwo ? `1/${root}${2 ** Math.round(halvings)}` : formatDyadic(magnitude);
}

/** An amplitude with its sign, such as +1/√2 or −1/2; one that is shown as zero has no sign. */
export function formatAmplitude(amplitude: number): string {
	const magnitude = formatMagnitude(Math.abs(amplitude));
	if (magnitude === "0") return magnitude;
	return `${amplitude < 0 ? minusSign : "+"}${magnitude}`;
}

/** A number with a minus sign when negative and no plus; one that is shown as zero has no sign. */
export function formatSigned(value: number): string {
	const magnitude = formatDyadic(Math.abs(value));
	return value < 0 && magnitude !== "0" ? `${minusSign}${magnitude}` : magnitude;
}

/** The amplitudes that are not shown as zero, each after its label, for reading aloud. */
export const listAmplitudes = (labels: readonly string[], amplitudes: readonly number[]): string =>
	amplitudes
		.map((amplitude, index) => `${labels[index]} ${formatAmplitude(amplitude)}`)
		.filter((_, index) => formatAmplitude(amplitudes[index] ?? 0) !== "0")
		.join(", ");

export const ket = (label: string): string => `|${label}⟩`;
