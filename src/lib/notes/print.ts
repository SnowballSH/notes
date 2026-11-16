import type { Attachment } from "svelte/attachments";
import { blocksIn } from "./blocks.ts";

/**
 * A printout should show every proof, on white paper. Collapsed blocks open and the light
 * theme applies while the page prints, and both go back afterwards.
 */
export const prepareForPrint: Attachment = (container) => {
	const page = document.documentElement;
	let opened: HTMLDetailsElement[] = [];
	let theme: string | undefined;
	const prepare = () => {
		const closed = blocksIn(container).filter((block) => !block.open);
		for (const details of closed) details.open = true;
		opened = [...opened, ...closed];
		theme ??= page.dataset.theme;
		page.dataset.theme = "light";
	};
	const restore = () => {
		for (const details of opened) details.open = false;
		opened = [];
		if (theme !== undefined) page.dataset.theme = theme;
		theme = undefined;
	};
	window.addEventListener("beforeprint", prepare);
	window.addEventListener("afterprint", restore);
	return () => {
		restore();
		window.removeEventListener("beforeprint", prepare);
		window.removeEventListener("afterprint", restore);
	};
};
