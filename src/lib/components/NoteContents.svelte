<script lang="ts">
import type { NoteHeading } from "#lib/notes/types.ts";

const { headings }: { headings: NoteHeading[] } = $props();
const titleId = $props.id();

/** A heading counts as reached once it is this close to the top of the window. */
const reachedWithin = 120;
let current = $state<string>();

$effect(() => {
	const targets = headings.flatMap((heading) => document.getElementById(heading.id) ?? []);
	const update = () => {
		const page = document.documentElement;
		const atEnd = window.innerHeight + window.scrollY >= page.scrollHeight - 2;
		const reached = targets.filter((target) => target.getBoundingClientRect().top <= reachedWithin);
		current = (atEnd ? targets : reached).at(-1)?.id;
	};
	update();
	window.addEventListener("scroll", update, { passive: true });
	window.addEventListener("resize", update);
	return () => {
		window.removeEventListener("scroll", update);
		window.removeEventListener("resize", update);
	};
});
</script>

{#if headings.length > 1}
	<nav aria-labelledby={titleId} class="on-this-page">
		<p id={titleId}>On this page</p>
		<ol>
			{#each headings as heading (heading.id)}
				<li class:nested={heading.level > 2}>
					<a href="#{heading.id}" aria-current={current === heading.id ? "location" : undefined}>
						{heading.text}
					</a>
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
.on-this-page {
	margin-top: 1.5rem;
	border-left: 2px solid var(--fui-line);
	font-size: 0.875rem;
}
p {
	padding-left: 1rem;
	color: var(--fui-ink-muted);
}
li.nested a {
	padding-left: 2rem;
}
/* The mark for the section being read is drawn over the list's rule, so it moves no text. */
a {
	display: flex;
	align-items: center;
	margin-left: -2px;
	padding: 0.25rem 0.375rem 0.25rem 1rem;
	border-left: 2px solid transparent;
	color: var(--fui-ink-secondary);
}
a:hover,
a[aria-current] {
	color: var(--fui-accent-strong);
}
a[aria-current] {
	border-left-color: var(--fui-accent);
}
a:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: -2px;
}
/* Wide windows have room beside the text column, so the list stays in view there. */
@media (min-width: 80rem) {
	.on-this-page {
		position: fixed;
		top: 6rem;
		left: calc(50% + 24rem + 2rem);
		width: 13rem;
		max-height: calc(100vh - 8rem);
		margin-top: 0;
		overflow-y: auto;
	}
}
@media (pointer: coarse) {
	a {
		min-height: 2.75rem;
	}
}
</style>
