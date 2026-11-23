import { parseFragment } from "parse5";
import type { WidgetDefinition } from "#lib/widgets/contract.ts";
import { propProblems } from "#lib/widgets/props.ts";
import { widgetDefinitions } from "#lib/widgets/registry.ts";
import { TypstError } from "./cli";
import { attribute, elementsNamed } from "./refine/dom";

type Definitions = Readonly<Record<string, WidgetDefinition>>;

function parseProps(json: string): Record<string, unknown> | undefined {
	try {
		const props: unknown = JSON.parse(json);
		return typeof props === "object" && props !== null && !Array.isArray(props)
			? (props as Record<string, unknown>)
			: undefined;
	} catch {
		return undefined;
	}
}

export function widgetProblems(
	html: string,
	definitions: Definitions = widgetDefinitions,
): string[] {
	return elementsNamed(parseFragment(html), "notes-widget").flatMap((placeholder) => {
		const name = attribute(placeholder, "name") ?? "";
		const definition = definitions[name];
		if (!definition) {
			return [`unknown widget "${name}"; the widgets are ${Object.keys(definitions).join(", ")}`];
		}
		const props = parseProps(attribute(placeholder, "props") ?? "{}");
		const problems = props
			? propProblems(definition.props, props)
			: ["its props are not named values"];
		return problems.map((problem) => `widget "${name}": ${problem}`);
	});
}

export function assertValidWidgets(html: string, file: string, definitions?: Definitions): void {
	const problems = widgetProblems(html, definitions);
	if (problems.length > 0) {
		throw new TypstError(problems.map((problem) => `${file}: ${problem}`).join("\n"));
	}
}
