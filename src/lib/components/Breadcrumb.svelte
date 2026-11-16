<script lang="ts">
import { Link } from "foundationui/svelte";

interface Crumb {
	label: string;
	/** Omitted for a level that has no page of its own. */
	href?: string;
}

const { trail }: { trail: Crumb[] } = $props();
</script>

<nav aria-label="Breadcrumb" class="text-sm text-ink-muted">
	<ol class="flex flex-wrap gap-x-2">
		{#each trail as crumb, index (crumb.label)}
			<li class="flex gap-x-2">
				{#if index > 0}<span aria-hidden="true" class="py-1">/</span>{/if}
				{#if crumb.href}
					<Link href={crumb.href} subtle class="inline-block py-1">{crumb.label}</Link>
				{:else}
					<span class="py-1">{crumb.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
