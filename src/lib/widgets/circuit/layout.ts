import {
	diffusion,
	diffusionName,
	type GateLabel,
	hadamardOnEveryQubit,
	type Kind,
	repetitions,
	signFlipOffZero,
	signOracle,
	zeroKet,
} from "./circuit.ts";

/** The diagram in SVG units; at a note 288px wide one unit is one pixel. */
export const width = 288;
/** Three wires stand for n qubits, with a vertical ellipsis between the second and the third. */
export const wireRows = [22, 50, 98] as const;
export const ellipsisRow = 74;
export const ellipsisPitch = 6;
export const ellipsisDotRadius = 1.25;

const gateTop = 8;
const gateHeight = 104;
const gateBottom = gateTop + gateHeight;
const gateCentreRow = gateTop + gateHeight / 2;
const wideGate = 48;
const narrowGate = 36;
const bottomMargin = 8;

const wireStart = 26;
const wireEnd = 286;
const leadCentre = 11;

export const meterWidth = 26;
export const meterHeight = 20;

export const baseFontSize = 14;
export const scriptFontSize = 11;
export const leadFontSize = 12;
/** Every glyph of the mono font is this fraction of the font size wide. */
const monoAdvance = 0.6;
export const baseBaseline = gateCentreRow + 5;
export const supBaseline = baseBaseline - 8;
export const subBaseline = baseBaseline + 4;
const scriptGap = 0.5;

const bracketDrop = 6;
const bracketDepth = 6;
const bracketReach = 6;
const repeatLabelDrop = 14;

export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface PlacedGate extends Box {
	label: GateLabel;
	/** The one gate that queries f, drawn in the accent colour. */
	query: boolean;
}

export interface Lead {
	text: string;
	y: number;
}

/** A bracket under the gates that are repeated, with the number of repetitions below it. */
export interface Repeat {
	x1: number;
	x2: number;
	y: number;
	depth: number;
	label: string;
	labelX: number;
	labelY: number;
}

export interface Diagram {
	height: number;
	wire: { x1: number; x2: number };
	/** What stands at the left end of the wires, centred on leadCentre. */
	leads: readonly Lead[];
	leadX: number;
	gates: readonly PlacedGate[];
	meters: readonly Box[];
	ellipsisColumns: readonly number[];
	repeat?: Repeat;
}

const gate = (label: GateLabel, x: number, gateWidth = wideGate, query = false): PlacedGate => ({
	label,
	query,
	x,
	y: gateTop,
	width: gateWidth,
	height: gateHeight,
});

const metersAt = (x: number): Box[] =>
	wireRows.map((row) => ({
		x,
		y: row - meterHeight / 2,
		width: meterWidth,
		height: meterHeight,
	}));

const kets: readonly Lead[] = wireRows.map((y) => ({ text: zeroKet, y }));
const wire = { x1: wireStart, x2: wireEnd };

function repeatUnder(gates: readonly PlacedGate[]): Repeat {
	const x1 = Math.min(...gates.map((placed) => placed.x)) - bracketReach;
	const x2 = Math.max(...gates.map((placed) => placed.x + placed.width)) + bracketReach;
	const y = gateBottom + bracketDrop;
	return {
		x1,
		x2,
		y,
		depth: bracketDepth,
		label: repetitions,
		labelX: (x1 + x2) / 2,
		labelY: y + bracketDepth + repeatLabelDrop,
	};
}

const fourierMeters = 234;
const groverMeters = 236;
const groverRepeated = [gate(signOracle, 110, wideGate, true), gate(diffusion, 170, narrowGate)];
const groverRepeat = repeatUnder(groverRepeated);

const diffusionGates = [
	gate(hadamardOnEveryQubit, 46),
	gate(signFlipOffZero, 132),
	gate(hadamardOnEveryQubit, 218),
];

const gapsBetween = (gates: readonly PlacedGate[]): number[] =>
	gates.slice(1).map((next, index) => {
		const previous = gates[index] as PlacedGate;
		return (previous.x + previous.width + next.x) / 2;
	});

const circuits: Record<Kind, Diagram> = {
	"fourier-sampling": {
		height: gateBottom + bottomMargin,
		wire,
		leads: kets,
		leadX: leadCentre,
		gates: [
			gate(hadamardOnEveryQubit, 38),
			gate(signOracle, 102, wideGate, true),
			gate(hadamardOnEveryQubit, 166),
		],
		meters: metersAt(fourierMeters),
		ellipsisColumns: [leadCentre, fourierMeters + meterWidth / 2],
	},
	grover: {
		height: groverRepeat.labelY + bottomMargin,
		wire,
		leads: kets,
		leadX: leadCentre,
		gates: [gate(hadamardOnEveryQubit, 38), ...groverRepeated],
		meters: metersAt(groverMeters),
		ellipsisColumns: [leadCentre, groverMeters + meterWidth / 2],
		repeat: groverRepeat,
	},
};

export const circuitDiagram = (kind: Kind): Diagram => circuits[kind];

/** D written out as the three gates it is made of. */
export const diffusionDiagram: Diagram = {
	height: gateBottom + bottomMargin,
	wire,
	leads: [{ text: diffusionName, y: gateCentreRow }],
	leadX: leadCentre,
	gates: diffusionGates,
	meters: [],
	ellipsisColumns: gapsBetween(diffusionGates),
};

const scriptLength = (label: GateLabel): number =>
	Math.max(label.sup?.length ?? 0, label.sub?.length ?? 0);

const baseWidth = (label: GateLabel): number => label.base.length * baseFontSize * monoAdvance;

export const labelWidth = (label: GateLabel): number => {
	const scripts = scriptLength(label) * scriptFontSize * monoAdvance;
	return baseWidth(label) + (scripts > 0 ? scriptGap + scripts : 0);
};

export const leadWidth = (lead: Lead): number => lead.text.length * leadFontSize * monoAdvance;

export interface LabelAnchors {
	/** Where the letter starts. */
	base: number;
	/** Where its superscript and subscript start, one above the other. */
	script: number;
}

/** Where to set a gate's name so that the letter and its scripts together are centred. */
export function labelAnchors(placed: PlacedGate): LabelAnchors {
	const base = placed.x + (placed.width - labelWidth(placed.label)) / 2;
	return { base, script: base + baseWidth(placed.label) + scriptGap };
}
