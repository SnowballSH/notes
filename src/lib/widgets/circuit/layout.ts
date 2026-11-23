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
const nameCentre = 12;
const stubCentre = (wireStart + 46) / 2;

export const meterWidth = 26;
export const meterHeight = 20;

export const baseFontSize = 18;
export const scriptFontSize = 13;
export const leadFontSize = 13;
/** How wide each glyph of STIX Two Math is, as a fraction of the font size (from its hmtx table). */
const advances: Readonly<Record<string, number>> = {
	H: 0.777,
	O: 0.738,
	D: 0.73,
	Z: 0.594,
	n: 0.576,
	f: 0.307,
	"0": 0.495,
	"±": 0.72,
	"⊗": 0.862,
	"|": 0.267,
	"⟩": 0.339,
	"=": 0.72,
	" ": 0.235,
};
const widestAdvance = 0.862;
export const baseBaseline = gateCentreRow + 6;
export const supBaseline = baseBaseline - 9;
export const subBaseline = baseBaseline + 5;
const scriptGap = 1;

const bracketDrop = 6;
const bracketDepth = 6;
const bracketReach = 6;
const repeatLabelDrop = 14;
const repeatMargin = 4;

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
	/** What stands at the left end of the wires, centred on leadX. */
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
		height: groverRepeat.labelY + repeatMargin,
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
	leadX: nameCentre,
	gates: diffusionGates,
	meters: [],
	ellipsisColumns: [stubCentre, wireStart + wireEnd - stubCentre],
};

export const textWidth = (text: string, fontSize: number): number =>
	[...text].reduce((sum, glyph) => sum + (advances[glyph] ?? widestAdvance), 0) * fontSize;

const baseWidth = (label: GateLabel): number => textWidth(label.base, baseFontSize);

export const labelWidth = (label: GateLabel): number => {
	const scripts = Math.max(
		textWidth(label.sup ?? "", scriptFontSize),
		textWidth(label.sub ?? "", scriptFontSize),
	);
	return baseWidth(label) + (scripts > 0 ? scriptGap + scripts : 0);
};

export const leadWidth = (lead: Lead): number => textWidth(lead.text, leadFontSize);

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
