<script lang="ts">
import { siteName, siteOrigin } from "#lib/site/title.ts";
import { page } from "$app/state";

interface Props {
	title: string;
	description?: string | null;
	/** "article" for a note, "website" for the pages that lead to notes. */
	kind?: "article" | "website";
}

const { title, description = null, kind = "website" }: Props = $props();
const address = $derived(`${siteOrigin}${page.url.pathname === "/" ? "/" : page.url.pathname}`);
</script>

<svelte:head>
	<title>{title}</title>
	<link rel="canonical" href={address} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:type" content={kind} />
	<meta property="og:title" content={title} />
	<meta property="og:url" content={address} />
	{#if description}
		<meta name="description" content={description} />
		<meta property="og:description" content={description} />
	{/if}
</svelte:head>
