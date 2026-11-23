<script lang="ts">
interface Props {
	/** From -1 to 1: the height of the bar as a fraction of the box its parent gives it. */
	amplitude: number;
	/** Whether the colour tells the sign of the amplitude or is the same for both signs. */
	tone?: "sign" | "neutral" | "accent";
}

const { amplitude, tone = "sign" }: Props = $props();
</script>

<span
	class="bar"
	class:negative={tone === "sign" && amplitude < 0}
	class:neutral={tone === "neutral"}
	style:--amplitude={amplitude}
></span>

<style>
.bar {
	position: absolute;
	/* A negative scale mirrors the bar below the axis, so a sign flip animates through zero. */
	transform: scaleY(var(--amplitude));
	transform-origin: bottom;
	border-radius: var(--fui-radius-xs) var(--fui-radius-xs) 0 0;
	background: var(--fui-accent);
	transition:
		transform 250ms ease-out,
		background-color 250ms ease-out;
}
.bar.negative {
	background: var(--fui-code-warm);
}
.bar.neutral {
	background: var(--fui-ink-muted);
}
@media (prefers-reduced-motion: reduce) {
	.bar {
		transition: none;
	}
}
@media print {
	.bar {
		print-color-adjust: exact;
	}
}
</style>
