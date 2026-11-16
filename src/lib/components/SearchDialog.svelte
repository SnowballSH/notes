<script lang="ts">
import { Dialog, Input } from "foundationui/svelte";
import { search } from "#lib/search/match.ts";
import type { SearchEntry } from "#lib/search/types.ts";
import { goto } from "$app/navigation";

const kinds: Record<SearchEntry["kind"], string> = { note: "Note", section: "Section", card: "" };

let open = $state(false);
let query = $state("");
let active = $state(0);
let entries = $state<SearchEntry[]>();
let failed = $state(false);
let list = $state<HTMLElement>();

const found = $derived(entries ? search(entries, query) : { shown: [], total: 0 });
const results = $derived(found.shown);

async function load(): Promise<void> {
	if (entries) return;
	failed = false;
	try {
		const response = await fetch("/search.json");
		if (!response.ok) throw new Error(`search index: ${response.status}`);
		entries = (await response.json()) as SearchEntry[];
	} catch {
		failed = true;
	}
}

const status = $derived.by(() => {
	if (failed) return "The search index could not be loaded.";
	if (!entries) return "Loading...";
	if (query.trim() === "") return "";
	if (results.length === 0) return "Nothing matches.";
	if (found.total > results.length) return `The first ${results.length} of ${found.total} results`;
	return results.length === 1 ? "1 result" : `${results.length} results`;
});

$effect(() => {
	list?.querySelectorAll("a")[active]?.scrollIntoView({ block: "nearest" });
});

function show(): void {
	query = "";
	active = 0;
	open = true;
	void load();
}

function follow(entry: SearchEntry | undefined): void {
	if (!entry) return;
	open = false;
	void goto(entry.href);
}

function onShortcut(event: KeyboardEvent): void {
	const typing =
		event.target instanceof HTMLElement && event.target.matches("input, textarea, select");
	const opens =
		(event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing);
	if (!opens || open) return;
	event.preventDefault();
	show();
}

function onResultKey(event: KeyboardEvent): void {
	const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
	if (step !== 0 && results.length > 0) {
		event.preventDefault();
		active = (active + step + results.length) % results.length;
	} else if (event.key === "Enter") {
		event.preventDefault();
		follow(results[active]);
	}
}
</script>

<svelte:window onkeydown={onShortcut} />

<button type="button" class="search-button" onclick={show} aria-keyshortcuts="Control+K Meta+K /">
	Search
</button>

<Dialog bind:open title="Search the notes">
	<Input
		type="search"
		placeholder="A theorem, a definition, a section..."
		aria-label="Search the notes"
		autocomplete="off"
		bind:value={query}
		oninput={() => (active = 0)}
		onkeydown={onResultKey}
	/>
	<p class="status" role="status">{status}</p>
	<ul class="results" aria-label="Results" bind:this={list}>
		{#each results as result, index (result.href)}
			<li>
				<a
					href={result.href}
					aria-current={index === active ? "true" : undefined}
					onclick={() => (open = false)}
					onpointerenter={() => (active = index)}
				>
					<span class="label">{result.label}</span>
					<span class="context">{[kinds[result.kind], result.context].filter(Boolean).join(" in ")}</span>
				</a>
			</li>
		{/each}
	</ul>
</Dialog>

<style>
.search-button {
	margin-left: auto;
	margin-right: 0.5rem;
	min-height: 2.25rem;
	padding: 0 0.75rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	font-size: 0.875rem;
	color: var(--fui-ink-secondary);
	cursor: pointer;
}
.search-button:hover {
	border-color: var(--fui-accent);
	color: var(--fui-accent-strong);
}
.search-button:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
.status {
	min-height: 1.25rem;
	margin-top: 0.75rem;
	font-size: 0.875rem;
	color: var(--fui-ink-muted);
}
.results {
	margin-top: 0.5rem;
	max-height: min(24rem, 50vh);
	overflow-y: auto;
}
.results a {
	display: block;
	padding: 0.5rem 0.625rem;
	border-radius: var(--fui-radius-sm);
}
.results a[aria-current] {
	background: var(--fui-surface-raised);
}
.label {
	display: block;
	color: var(--fui-ink);
}
.context {
	display: block;
	font-size: 0.8125rem;
	color: var(--fui-ink-muted);
}
@media print {
	.search-button {
		display: none;
	}
}
</style>
