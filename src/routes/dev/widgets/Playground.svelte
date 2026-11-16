<script lang="ts">
import { Link } from "foundationui/svelte";
import { widgetDefinitions } from "#lib/widgets/registry.ts";
import WidgetBench from "./WidgetBench.svelte";

const benches = Object.entries(widgetDefinitions);
</script>

<p class="text-sm text-ink-muted">Only while developing</p>
<h1 class="mt-1 font-display text-3xl font-semibold text-ink">Widget playground</h1>
<p class="mt-3 text-ink-secondary">
	Every widget in <code class="font-mono text-sm">src/lib/widgets</code>, at the width of a note.
	Change a prop to mount the widget again with it.
</p>
<nav class="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm" aria-label="Widgets">
	{#each benches as [name] (name)}
		<Link href="#{name}">{name}</Link>
	{/each}
</nav>

{#each benches as [name, definition] (name)}
	<WidgetBench {name} {definition} />
{/each}
