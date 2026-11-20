import type { Attachment } from "svelte/attachments";

const scrollingBlocks = "pre, table:not(notes-widget *)";

/** A region that scrolls sideways can be reached and scrolled with the keyboard. */
export function reachIfScrolling(region: HTMLElement): void {
	if (region.scrollWidth > region.clientWidth + 1) region.tabIndex = 0;
	else region.removeAttribute("tabindex");
}

/**
 * A code block or a table too wide for the screen scrolls sideways on its own, so the
 * keyboard has to be able to reach it. One that fits stays out of the tab order.
 */
export const reachScrollingBlocks: Attachment = (container) => {
	const reachAll = () => {
		for (const block of container.querySelectorAll<HTMLElement>(scrollingBlocks))
			reachIfScrolling(block);
	};
	const observer = new ResizeObserver(reachAll);
	observer.observe(container);
	container.addEventListener("toggle", reachAll, true);
	document.fonts.ready.then(reachAll);
	return () => {
		observer.disconnect();
		container.removeEventListener("toggle", reachAll, true);
	};
};
