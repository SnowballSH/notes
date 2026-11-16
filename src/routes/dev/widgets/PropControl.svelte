<script lang="ts">
import type { PropSpec, PropValue } from "#lib/widgets/contract.ts";
import { describeAllowed } from "#lib/widgets/props.ts";

interface Props {
	name: string;
	spec: PropSpec;
	value: PropValue;
	onchange: (value: PropValue) => void;
}

const { name, spec, value, onchange }: Props = $props();

const bounded = $derived(
	(spec.type === "integer" || spec.type === "number") &&
		spec.min !== undefined &&
		spec.max !== undefined,
);
const step = $derived(spec.type === "integer" ? 1 : "any");
</script>

<label>
	<span class="name">{name}</span>
	{#if spec.type === "integer" || spec.type === "number"}
		<input
			type={bounded ? "range" : "number"}
			min={spec.min}
			max={spec.max}
			{step}
			{value}
			oninput={(event) => onchange(event.currentTarget.valueAsNumber)}
		/>
		{#if bounded}<output>{value}</output>{/if}
	{:else if spec.type === "boolean"}
		<input
			type="checkbox"
			checked={value === true}
			onchange={(event) => onchange(event.currentTarget.checked)}
		/>
	{:else if spec.type === "choice"}
		<select {value} onchange={(event) => onchange(event.currentTarget.value)}>
			{#each spec.options as option (option)}
				<option>{option}</option>
			{/each}
		</select>
	{:else}
		<input type="text" {value} oninput={(event) => onchange(event.currentTarget.value)} />
	{/if}
	<span class="allowed">{describeAllowed(spec)}, default {spec.default}</span>
</label>

<style>
label {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.25rem 0.75rem;
	min-height: 2.25rem;
}
.name {
	min-width: 5rem;
	font-family: var(--fui-font-mono);
	color: var(--fui-ink);
}
input:is([type="number"], [type="text"]),
select {
	width: 9rem;
	padding: 0.25rem 0.5rem;
	border: 1px solid var(--fui-line);
	border-radius: var(--fui-radius-sm);
	background: var(--fui-surface-base);
	color: var(--fui-ink);
	font: inherit;
}
input[type="range"] {
	width: 9rem;
}
input:focus-visible,
select:focus-visible {
	outline: 2px solid var(--fui-accent);
	outline-offset: 2px;
}
output {
	min-width: 1.5rem;
	font-family: var(--fui-font-mono);
}
.allowed {
	color: var(--fui-ink-muted);
}
</style>
