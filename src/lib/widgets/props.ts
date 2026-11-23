import type { PropSchema, PropSpec, Range } from "./contract.ts";

function describeRange(noun: string, { min, max }: Range): string {
	if (min !== undefined && max !== undefined) return `${noun} from ${min} to ${max}`;
	if (min !== undefined) return `${noun} of at least ${min}`;
	if (max !== undefined) return `${noun} of at most ${max}`;
	return noun;
}

export function describeAllowed(spec: PropSpec): string {
	switch (spec.type) {
		case "integer":
			return describeRange("an integer", spec);
		case "number":
			return describeRange("a number", spec);
		case "boolean":
			return "true or false";
		case "text":
			return "text";
		case "choice":
			return `one of ${spec.options.map((option) => JSON.stringify(option)).join(", ")}`;
	}
}

const inRange = (value: number, { min, max }: Range): boolean =>
	Number.isFinite(value) &&
	(min === undefined || value >= min) &&
	(max === undefined || value <= max);

function accepts(spec: PropSpec, value: unknown): boolean {
	switch (spec.type) {
		case "integer":
			return Number.isInteger(value) && inRange(value as number, spec);
		case "number":
			return typeof value === "number" && inRange(value, spec);
		case "boolean":
			return typeof value === "boolean";
		case "text":
			return typeof value === "string";
		case "choice":
			return typeof value === "string" && spec.options.includes(value);
	}
}

const shown = (value: unknown): string =>
	typeof value === "number" ? String(value) : (JSON.stringify(value) ?? String(value));

export function propProblems(
	schema: PropSchema,
	given: Readonly<Record<string, unknown>>,
): string[] {
	const names = Object.keys(schema);
	const takes = names.length > 0 ? `it takes ${names.join(", ")}` : "it takes no props";
	return Object.entries(given).flatMap(([name, value]) => {
		const spec = schema[name];
		if (!spec) return [`unknown prop "${name}"; ${takes}`];
		if (accepts(spec, value)) return [];
		return [`prop "${name}" must be ${describeAllowed(spec)}, not ${shown(value)}`];
	});
}
