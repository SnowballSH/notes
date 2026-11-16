import { componentName, isWidgetName } from "../../src/lib/widgets/names.ts";
import { widgetUsage } from "../../src/lib/widgets/usage.ts";

const sharedFiles = new Set([
	"contract",
	"mount",
	"names",
	"props",
	"registry",
	"usage",
	"widget-frame",
]);

export interface ScaffoldFile {
	path: string;
	content: string;
}

export interface WidgetScaffold {
	directory: string;
	files: ScaffoldFile[];
	/** The line that puts the new widget in a note. */
	usage: string;
}

const definition = `import { defineWidget } from "../contract.ts";

export default defineWidget({
	props: {
		start: { type: "integer", default: 0, min: 0, max: 99 },
	},
	height: "4.8125rem",
});
`;

const component = `<script lang="ts">
import { untrack } from "svelte";
import type { WidgetProps } from "../contract.ts";
import WidgetFrame from "../WidgetFrame.svelte";
import type definition from "./definition.ts";

const { start }: WidgetProps<typeof definition> = $props();

let count = $state(untrack(() => start));
</script>

<WidgetFrame>
	<button type="button" onclick={() => count++}>Add one</button>
	{#snippet caption()}
		<p>The count is {count}.</p>
	{/snippet}
</WidgetFrame>

<style>
button {
	height: 2.75rem;
	padding: 0 1rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	cursor: pointer;
}
button:hover {
	border-color: var(--fui-accent);
	background: var(--fui-surface-raised);
}
button:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
@media print {
	button {
		display: none;
	}
}
</style>
`;

export function widgetNameProblem(name: string | undefined): string | undefined {
	if (name === undefined) return "give the widget a name, such as demo-counter";
	if (!isWidgetName(name)) {
		return `"${name}" is not a widget name: use lowercase words joined by hyphens, starting with a letter`;
	}
	if (sharedFiles.has(name)) {
		return `"${name}" is the name of a file every widget shares in src/lib/widgets; choose another`;
	}
	return undefined;
}

export function widgetScaffold(name: string): WidgetScaffold {
	const directory = `src/lib/widgets/${name}`;
	return {
		directory,
		files: [
			{ path: `${directory}/definition.ts`, content: definition },
			{ path: `${directory}/${componentName(name)}.svelte`, content: component },
		],
		usage: widgetUsage(name, {}, {}, "Shown until the widget loads."),
	};
}
