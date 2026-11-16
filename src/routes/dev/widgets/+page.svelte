<script lang="ts">
import { pageTitle } from "#lib/site/title.ts";

const { data } = $props();
</script>

<svelte:head>
	<title>{pageTitle("Widget playground")}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<data.Playground />
