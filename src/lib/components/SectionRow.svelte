<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	number: string;
	/** Omitted or null for a section that has no note to open. */
	href?: string | null;
	children: Snippet;
}

const { number, href = null, children }: Props = $props();
const layout = "-mx-3 flex min-h-11 items-baseline gap-3 rounded-md px-3 py-2.5";
</script>

{#snippet content()}
	<span class="w-8 shrink-0 text-sm tabular-nums text-ink-muted">{number}</span>
	<div class="min-w-0 flex-1">{@render children()}</div>
{/snippet}

{#if href}
	<a
		{href}
		class={[
			layout,
			"group no-underline transition-colors hover:bg-surface-raised",
			"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
		]}
	>
		{@render content()}
	</a>
{:else}
	<div class={layout}>{@render content()}</div>
{/if}
