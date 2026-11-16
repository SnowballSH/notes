import { widgetHeight } from "#lib/widgets/registry.ts";
import { attribute, elementsNamed, type ParentNode, setAttribute } from "./dom";

/** Reserves the height a widget will take, so that mounting it does not move the text below. */
export function reserveWidgetSpace(root: ParentNode): void {
	for (const placeholder of elementsNamed(root, "notes-widget")) {
		const height = widgetHeight(attribute(placeholder, "name") ?? "");
		if (height) setAttribute(placeholder, "style", `--widget-height: ${height}`);
	}
}
