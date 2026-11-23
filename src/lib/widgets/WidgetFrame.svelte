<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	children: Snippet;
	caption?: Snippet;
}

const { children, caption }: Props = $props();
</script>

<figure class="widget-frame">
	{@render children()}
	{#if caption}
		<figcaption aria-live="polite">{@render caption()}</figcaption>
	{/if}
</figure>

<style>
.widget-frame {
	margin: 0;
	display: grid;
	gap: 0.75rem;
	justify-items: start;
	font-family: var(--fui-font-sans);
	text-align: start;
}
.widget-frame > figcaption {
	margin: 0;
	display: grid;
	gap: 0.25rem;
	font-size: 0.875rem;
	line-height: 1.5;
	color: var(--fui-ink-secondary);
}
.widget-frame :global(.spoken) {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: 0;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
}
/* :where() keeps these below any rule in a widget's own style block. */
:global(.widget-frame :where(button)) {
	min-height: 2.75rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: transparent;
	color: var(--fui-ink);
	font: inherit;
	cursor: pointer;
}
:global(.widget-frame :where(button:not([aria-disabled="true"]):hover)) {
	border-color: var(--fui-accent);
	background: var(--fui-surface-raised);
}
:global(.widget-frame :where(button[aria-disabled="true"])) {
	border-style: dashed;
	color: var(--fui-ink-muted);
	opacity: 0.45;
	cursor: not-allowed;
}
:global(.widget-frame :where(button:focus-visible)) {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
</style>
