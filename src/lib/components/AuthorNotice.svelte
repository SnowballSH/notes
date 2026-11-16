<script lang="ts">
const { title, details }: { title: string; details: string[] } = $props();
</script>

<aside class="notice" role="alert">
	<p>{title}</p>
	{#each details as detail (detail)}
		<pre>{detail}</pre>
	{/each}
	<p class="hint">Only shown while developing. The site build fails until this is fixed.</p>
</aside>

<style>
.notice {
	margin-top: 1.5rem;
	padding: 0.875rem 1rem;
	border: 1px solid var(--fui-code-warm);
	border-radius: var(--fui-radius-md);
	color: var(--fui-ink);
}
p {
	font-weight: 600;
}
pre {
	margin-top: 0.5rem;
	overflow-x: auto;
	font-family: var(--fui-font-mono);
	font-size: 0.8125rem;
	line-height: 1.5;
}
.hint {
	margin-top: 0.5rem;
	font-size: 0.875rem;
	font-weight: 400;
	color: var(--fui-ink-secondary);
}
</style>
