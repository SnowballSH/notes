<script lang="ts">
import type { Attachment } from "svelte/attachments";
import { defaultProps, type PropValue, type WidgetDefinition } from "#lib/widgets/contract.ts";
import { widgets } from "#lib/widgets/mount.ts";
import { propProblems } from "#lib/widgets/props.ts";
import { widgetUsage } from "#lib/widgets/usage.ts";
import PropControl from "./PropControl.svelte";

interface Props {
	name: string;
	definition: WidgetDefinition;
}

const { name, definition }: Props = $props();
const schema = $derived(definition.props);

let edited = $state<Record<string, PropValue>>({});
const values = $derived<Record<string, PropValue>>({ ...defaultProps(schema), ...edited });
const problems = $derived(propProblems(schema, values));

let mountedProps = $state<Record<string, PropValue>>({});
const usage = $derived(widgetUsage(name, schema, mountedProps));

function change(prop: string, value: PropValue): void {
	edited[prop] = value;
	if (propProblems(schema, { ...values, [prop]: value }).length === 0) {
		mountedProps = { ...values, [prop]: value };
	}
}

let restarts = $state(0);
function reset(): void {
	edited = {};
	mountedProps = {};
	restarts++;
}

let copied = $state(false);
async function copyUsage(): Promise<void> {
	await navigator.clipboard.writeText(usage);
	copied = true;
}

let takenHeight = $state<number>();
let reservedHeight = $state<number>();

const measured =
	(record: (height: number) => void): Attachment<HTMLElement> =>
	(element) => {
		const observer = new ResizeObserver(() => record(element.getBoundingClientRect().height));
		observer.observe(element);
		return () => observer.disconnect();
	};

const pixels = (height: number): string => `${Math.round(height * 100) / 100}px`;
const jump = $derived(
	takenHeight !== undefined && reservedHeight !== undefined ? takenHeight - reservedHeight : 0,
);
const jumps = $derived(Math.abs(jump) > 0.5);
</script>

<section id={name} class="bench">
	<header>
		<h2>{name}</h2>
		<button type="button" onclick={reset}>Reset</button>
	</header>

	{#if Object.keys(schema).length > 0}
		<div class="controls">
			{#each Object.entries(schema) as [prop, spec] (prop)}
				<PropControl
					name={prop}
					{spec}
					value={values[prop] ?? spec.default}
					onchange={(value) => change(prop, value)}
				/>
			{/each}
		</div>
	{:else}
		<p class="quiet">This widget takes no props.</p>
	{/if}

	{#if problems.length > 0}
		<ul class="problems" role="alert">
			{#each problems as problem (problem)}
				<li>{problem}</li>
			{/each}
		</ul>
	{/if}

	<div class="usage">
		<code>{usage}</code>
		<button type="button" onclick={copyUsage} onblur={() => (copied = false)}>
			{copied ? "Copied" : "Copy"}
		</button>
	</div>

	{#key `${restarts} ${usage}`}
		<article class="note" {@attach widgets}>
			<notes-widget {name} props={JSON.stringify(mountedProps)} {@attach measured((height) => (takenHeight = height))}>
				Fallback text.
			</notes-widget>
		</article>
	{/key}

	<p class="quiet" class:warning={jumps}>
		{#if definition.height === undefined}
			Takes {pixels(takenHeight ?? 0)} here and reserves nothing, so the text below it jumps when
			it loads. Declare <code>height</code> in its definition to prevent that.
		{:else}
			Takes {pixels(takenHeight ?? 0)} here and reserves {pixels(reservedHeight ?? 0)}.
			{#if jumps}
				The text below it will jump by {pixels(Math.abs(jump))} when it loads: correct
				<code>height</code> in its definition.
			{/if}
		{/if}
	</p>
	{#if definition.height !== undefined}
		<div
			class="reserved"
			style:height={definition.height}
			{@attach measured((height) => (reservedHeight = height))}
		></div>
	{/if}
</section>

<style>
.bench {
	position: relative;
	margin-top: 3rem;
	padding-top: 1.5rem;
	border-top: 1px solid var(--fui-line);
	display: grid;
	gap: 1rem;
}
.bench > :not(.note) {
	font-size: 0.875rem;
	color: var(--fui-ink-secondary);
}
header,
.usage {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem 1rem;
}
h2 {
	font-family: var(--fui-font-mono);
	font-size: 1.125rem;
	font-weight: 600;
	color: var(--fui-ink);
}
button {
	min-height: 2rem;
	padding: 0 0.75rem;
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
.controls {
	display: grid;
	gap: 0.25rem;
}
.usage {
	padding: 0.5rem 0.75rem;
	border-radius: var(--fui-radius-md);
	background: var(--fui-surface-raised);
}
code {
	font-family: var(--fui-font-mono);
	color: var(--fui-ink);
	overflow-wrap: anywhere;
}
.problems,
.warning {
	color: var(--fui-code-warm);
}
.reserved {
	position: absolute;
	width: 0;
	visibility: hidden;
}
</style>
