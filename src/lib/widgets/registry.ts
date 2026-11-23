import type { Component } from "svelte";
import type { PropValue, WidgetDefinition } from "./contract.ts";
import { componentName } from "./names.ts";

export type WidgetComponent = Component<Record<string, PropValue>>;

const definitionModules = import.meta.glob<WidgetDefinition>("./*/definition.ts", {
	eager: true,
	import: "default",
});

const componentLoaders = import.meta.glob<WidgetComponent>("./*/*.svelte", { import: "default" });

export const widgetDefinitions: Readonly<Record<string, WidgetDefinition>> = Object.fromEntries(
	Object.entries(definitionModules)
		.map(([path, definition]) => [path.split("/")[1] ?? "", definition] as const)
		.sort(([a], [b]) => a.localeCompare(b)),
);

export const widgetNames: readonly string[] = Object.keys(widgetDefinitions);

export const componentPath = (name: string): string => `./${name}/${componentName(name)}.svelte`;

export const hasComponent = (name: string): boolean => componentPath(name) in componentLoaders;

export function loadWidget(name: string): Promise<WidgetComponent> {
	const load = componentLoaders[componentPath(name)];
	if (!load) return Promise.reject(new Error(`no component at ${componentPath(name)}`));
	return load();
}
