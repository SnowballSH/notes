import type { Component } from "svelte";

type WidgetLoader = () => Promise<{ default: Component<Record<string, unknown>> }>;

const registry: Record<string, WidgetLoader> = {
	"cayley-table": () => import("./CayleyTable.svelte"),
};

export const widgetNames = Object.keys(registry);

export function loadWidget(name: string): Promise<Component<Record<string, unknown>>> {
	const loader = registry[name];
	if (!loader) return Promise.reject(new Error(`unknown widget ${name}`));
	return loader().then((module) => module.default);
}
