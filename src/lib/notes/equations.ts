import type { Attachment } from "svelte/attachments";
import { reachIfScrolling } from "./scrolling.ts";

const smallestScale = 0.82;

function shrinkToFit(equation: HTMLElement): void {
	const math = equation.querySelector<HTMLElement>(":scope > math");
	if (!math) return;
	math.style.removeProperty("font-size");
	const style = getComputedStyle(equation);
	const room =
		equation.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
	const fullSize = parseFloat(getComputedStyle(math).fontSize);
	let size = fullSize;
	// Some spacing in a formula does not scale with the font, so one step can fall short.
	for (let step = 0; step < 4 && math.scrollWidth > room; step++) {
		size = Math.floor(size * (room / math.scrollWidth) * 100) / 100;
		if (size < fullSize * smallestScale) {
			math.style.removeProperty("font-size");
			return;
		}
		math.style.fontSize = `${size}px`;
	}
}

function settle(equation: HTMLElement): void {
	shrinkToFit(equation);
	reachIfScrolling(equation);
}

export const fitEquations: Attachment = (container) => {
	const equations = () => [...container.querySelectorAll<HTMLElement>(".equation")];
	const fitAll = () => {
		for (const equation of equations()) settle(equation);
	};
	const observer = new ResizeObserver(fitAll);
	observer.observe(container);
	const onToggle = (event: Event) => {
		if (!(event.target instanceof HTMLElement)) return;
		for (const equation of event.target.querySelectorAll<HTMLElement>(".equation"))
			settle(equation);
	};
	container.addEventListener("toggle", onToggle, true);
	document.fonts.ready.then(fitAll);
	return () => {
		observer.disconnect();
		container.removeEventListener("toggle", onToggle, true);
	};
};
