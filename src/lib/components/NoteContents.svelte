<script lang="ts">
import type { NoteHeading } from "#lib/notes/types.ts";

const { headings }: { headings: NoteHeading[] } = $props();
const titleId = $props.id();
const menuId = `${titleId}-menu`;
let menu = $state<HTMLElement>();

function toTop(event: MouseEvent): void {
	event.preventDefault();
	menu?.hidePopover();
	window.scrollTo({ top: 0 });
}

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

{#snippet links(onfollow?: () => void)}
	<ol>
		{#each headings as heading (heading.id)}
			<li class:nested={heading.level > 2}>
				<a
					href="#{heading.id}"
					aria-current={current === heading.id ? "location" : undefined}
					onclick={onfollow}
				>
					{heading.text}
				</a>
			</li>
		{/each}
	</ol>
{/snippet}

{#if headings.length > 1}
	<nav aria-labelledby={titleId} class="on-this-page">
		<p id={titleId}>On this page</p>
		{@render links()}
	</nav>

	<button type="button" class="jump-button" popovertarget={menuId}>Contents</button>
	<nav id={menuId} popover aria-label="Jump to a section" class="jump-menu" bind:this={menu}>
		{@render links(() => menu?.hidePopover())}
		<a href="#top" class="to-top" onclick={toTop}>Top of the page</a>
	</nav>
{/if}

<style>
.on-this-page {
	display: none;
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
ol a {
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
ol a[aria-current] {
	border-left-color: var(--fui-accent);
}
:is(a, .jump-button):focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: -2px;
}
/*
 * Below the width that has room for the pinned list, a button in the corner opens the same
 * list from anywhere on the page. On a phone it stands in for the list under the title,
 * which would fill most of the first screen.
 */
.jump-button {
	position: fixed;
	right: 1rem;
	bottom: 1rem;
	z-index: 20;
	min-height: 2.75rem;
	padding: 0 1rem;
	border: 1px solid var(--fui-line);
	border-radius: 999px;
	background: var(--fui-surface-raised);
	box-shadow: var(--fui-shadow-float-1);
	font-size: 0.875rem;
	color: var(--fui-ink);
	cursor: pointer;
}
.jump-menu {
	inset: auto 1rem 4.25rem auto;
	width: min(20rem, 100vw - 2rem);
	max-height: min(28rem, 100vh - 6rem);
	margin: 0;
	padding: 0.5rem 0;
	overflow-y: auto;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-md);
	background: var(--fui-surface-base);
	box-shadow: var(--fui-shadow-float-2);
	font-size: 0.9375rem;
	color: var(--fui-ink);
}
.jump-menu a {
	min-height: 2.75rem;
}
.to-top {
	display: flex;
	align-items: center;
	margin-top: 0.25rem;
	padding: 0.25rem 1rem;
	border-top: 1px solid var(--fui-line);
	color: var(--fui-ink-secondary);
}
@media (min-width: 40rem) {
	.on-this-page {
		display: block;
	}
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
	.jump-button,
	.jump-menu {
		display: none;
	}
}
@media (pointer: coarse) {
	ol a {
		min-height: 2.75rem;
	}
}
@media print {
	.jump-button,
	.jump-menu {
		display: none;
	}
}
</style>
