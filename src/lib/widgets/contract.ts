import { propProblems } from "./props.ts";

export interface Range {
	min?: number;
	max?: number;
}

export type PropSpec =
	| ({ type: "integer"; default: number } & Range)
	| ({ type: "number"; default: number } & Range)
	| { type: "boolean"; default: boolean }
	| { type: "text"; default: string }
	| { type: "choice"; options: readonly [string, ...string[]]; default: string };

export type PropSchema = Readonly<Record<string, PropSpec>>;

export type PropValue = number | boolean | string;

export interface WidgetDefinition<Schema extends PropSchema = PropSchema> {
	props: Schema;
	height?: string;
}

type ValueOf<Spec extends PropSpec> = Spec extends { type: "choice" }
	? Spec["options"][number]
	: Spec extends { type: "boolean" }
		? boolean
		: Spec extends { type: "text" }
			? string
			: number;

export type PropValues<Schema extends PropSchema> = {
	readonly [Name in keyof Schema]: ValueOf<Schema[Name]>;
};

export type WidgetProps<Definition extends WidgetDefinition> = PropValues<Definition["props"]>;

export function defineWidget<const Schema extends PropSchema>(
	definition: WidgetDefinition<Schema>,
): WidgetDefinition<Schema> {
	const problems = propProblems(definition.props, defaultProps(definition.props));
	if (problems.length > 0)
		throw new Error(`a widget's own defaults are invalid: ${problems.join("; ")}`);
	return definition;
}

export function defaultProps<Schema extends PropSchema>(schema: Schema): PropValues<Schema> {
	return Object.fromEntries(
		Object.entries(schema).map(([name, spec]) => [name, spec.default]),
	) as PropValues<Schema>;
}

export function resolveProps<Schema extends PropSchema>(
	schema: Schema,
	given: Readonly<Record<string, unknown>>,
): PropValues<Schema> {
	return { ...defaultProps(schema), ...given };
}
