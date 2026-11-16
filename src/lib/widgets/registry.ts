import type { Component } from "svelte";

type WidgetComponent = Component<Record<string, unknown>>;

interface Widget {
	load: () => Promise<{ default: WidgetComponent }>;
	/**
	 * The height the widget takes once mounted, as a CSS length, reserved beforehand so the
	 * page does not jump. It may depend on the window width, less the 2rem page gutter.
	 */
	height?: string;
}

const registry: Record<string, Widget> = {
	"hadamard-tiling": {
		load: () => import("./HadamardTiling.svelte"),
		height: "calc(3.5rem + min(100vw - 2rem, 20rem + 2px))",
	},
	"parity-explorer": { load: () => import("./ParityExplorer.svelte") },
};

export const widgetNames = Object.keys(registry);

export const widgetHeight = (name: string): string | undefined => registry[name]?.height;

export function loadWidget(name: string): Promise<WidgetComponent> {
	const widget = registry[name];
	if (!widget) return Promise.reject(new Error(`unknown widget ${name}`));
	return widget.load().then((module) => module.default);
}
