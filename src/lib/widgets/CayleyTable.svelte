<script lang="ts">
import { untrack } from "svelte";

interface Props {
	size?: number;
}

const { size = 4 }: Props = $props();
const maxSize = 12;

let modulus = $state(untrack(() => Math.min(Math.max(Math.round(size), 2), maxSize)));
let hovered = $state<{ row: number; column: number } | null>(null);
const elements = $derived(Array.from({ length: modulus }, (_, index) => index));
</script>

<figure class="cayley">
	<label>
		<span>n = {modulus}</span>
		<input type="range" min="2" max={maxSize} bind:value={modulus} />
	</label>
	<table onpointerleave={() => (hovered = null)}>
		<thead>
			<tr>
				<th scope="col">+</th>
				{#each elements as column (column)}
					<th scope="col" class:active={hovered?.column === column}>{column}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each elements as row (row)}
				<tr>
					<th scope="row" class:active={hovered?.row === row}>{row}</th>
					{#each elements as column (column)}
						<td
							class:identity={row === 0 || column === 0}
							class:active={hovered?.row === row && hovered?.column === column}
							onpointerenter={() => (hovered = { row, column })}
						>
							{(row + column) % modulus}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<figcaption>
		{#if hovered}
			{hovered.row} + {hovered.column} = {(hovered.row + hovered.column) % modulus} (mod {modulus})
		{:else}
			Shaded cells add the identity 0.
		{/if}
	</figcaption>
</figure>

<style>
.cayley {
	margin: 0;
	display: grid;
	gap: 0.75rem;
	justify-items: start;
	font-variant-numeric: tabular-nums;
}
label {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 0.875rem;
	color: var(--fui-ink-secondary);
}
label span {
	min-width: 3.5rem;
}
input {
	accent-color: var(--fui-accent);
}
table {
	border-collapse: collapse;
	font-family: var(--fui-font-mono);
	font-size: 0.875rem;
}
th,
td {
	width: 2rem;
	height: 2rem;
	text-align: center;
	border: 1px solid var(--fui-line);
}
th {
	color: var(--fui-ink-muted);
	font-weight: 500;
}
.identity {
	background: var(--fui-surface-raised);
}
.active {
	color: var(--fui-accent-strong);
	font-weight: 700;
}
figcaption {
	font-size: 0.875rem;
	color: var(--fui-ink-muted);
}
</style>
