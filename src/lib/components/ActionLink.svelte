<script lang="ts">
import type { Snippet } from "svelte";

const { href, children }: { href: string; children: Snippet } = $props();
</script>

<a
	{href}
	class={[
		"inline-flex min-h-11 items-center justify-center rounded-sm border border-transparent px-5 font-medium no-underline select-none",
		"bg-accent bg-linear-to-b from-accent to-accent-strong text-surface shadow-float-1 transition-colors hover:from-accent-strong hover:to-accent-strong",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
	]}
>
	{@render children()}
</a>
