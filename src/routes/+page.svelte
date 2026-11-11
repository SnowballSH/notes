<script lang="ts">
import { Link, Panel } from "foundationui/svelte";
import { walshHadamard } from "$lib/outlines/walsh-hadamard";
</script>

<svelte:head>
	<title>Notes</title>
	<meta name="description" content="Academic lecture notes by SnowballSH." />
</svelte:head>

<h1 class="font-display text-3xl font-semibold text-ink">Notes</h1>
<p class="mt-3 text-ink-secondary">Academic lecture notes by SnowballSH.</p>
<Panel class="mt-8">
	<p class="text-sm text-ink-muted">Special topics</p>
	<p class="mt-1">
		<Link href="/special-topics/walsh-hadamard">{walshHadamard.title}</Link>
	</p>
</Panel>
