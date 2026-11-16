import type { Attachment } from "svelte/attachments";

/** An equation this much too wide is shrunk to fit; a wider one scrolls sideways instead. */
const smallestScale = 0.86;

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
	for (let step = 0; step < 3 && math.scrollWidth > room; step++) {
		size = Math.floor(size * (room / math.scrollWidth) * 100) / 100;
		if (size < fullSize * smallestScale) {
			math.style.removeProperty("font-size");
			return;
		}
		math.style.fontSize = `${size}px`;
	}
}

/**
 * On a narrow screen many display equations miss the width by a few pixels. Those are set
 * slightly smaller so that they show whole, which leaves sideways scrolling to the
 * equations that are really too wide, which the keyboard can then reach and scroll.
 */
/** An equation that still scrolls can be reached and scrolled with the keyboard. */
function reachIfScrolling(equation: HTMLElement): void {
	if (equation.scrollWidth > equation.clientWidth + 1) equation.tabIndex = 0;
	else equation.removeAttribute("tabindex");
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
