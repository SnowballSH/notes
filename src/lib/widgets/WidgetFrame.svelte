<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	children: Snippet;
	/** What the widget shows right now. It is announced to screen readers when it changes. */
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
</style>
