import { widgetDefinitions } from "#lib/widgets/registry.ts";
import { attribute, elementsNamed, type ParentNode, setAttribute } from "./dom";

export function reserveWidgetSpace(root: ParentNode): void {
	for (const placeholder of elementsNamed(root, "notes-widget")) {
		const height = widgetDefinitions[attribute(placeholder, "name") ?? ""]?.height;
		if (height) setAttribute(placeholder, "style", `--widget-height: ${height}`);
	}
}
