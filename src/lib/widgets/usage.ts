import { typstString } from "../notes/typst.ts";
import type { PropSchema, PropValue } from "./contract.ts";

const typstValue = (value: PropValue): string =>
	typeof value === "string" ? typstString(value) : String(value);

/** The line that puts a widget in a note, passing only the props that differ from their defaults. */
export function widgetUsage(
	name: string,
	schema: PropSchema,
	props: Readonly<Record<string, PropValue>> = {},
	fallback = "Fallback text.",
): string {
	const changed = Object.entries(props)
		.filter(([prop, value]) => schema[prop]?.default !== value)
		.map(([prop, value]) => `, ${prop}: ${typstValue(value)}`);
	return `#widget(${typstString(name)}${changed.join("")})[${fallback}]`;
}
