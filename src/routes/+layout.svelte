<script lang="ts">
import "../app.css";
import { Footer, Header, Link, ThemeToggle } from "foundationui/svelte";
import SearchDialog from "#lib/components/SearchDialog.svelte";

const { children } = $props();
</script>

<Header>
	<a href="/" class="font-display text-sm font-semibold tracking-wide text-ink">Notes</a>
	<SearchDialog />
	<ThemeToggle />
</Header>
<main class="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
	{@render children()}
</main>
<Footer>
	<Link href="https://snowballsh.com" subtle>snowballsh.com</Link>
</Footer>
