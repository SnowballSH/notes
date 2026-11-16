import type { Attachment } from "svelte/attachments";

const zoomable = "figure img:not(.reference-preview *, .figure-zoom *)";

/** The width the dialog shows an image at; an image already that wide gains nothing from it. */
const enlargedWidth = (): number =>
	Math.min(0.8 * window.innerWidth, 0.72 * window.innerHeight, 768);

function enlarged(image: HTMLImageElement, caption: string): HTMLDialogElement {
	const dialog = document.createElement("dialog");
	dialog.className = "figure-zoom";
	dialog.setAttribute(
		"aria-label",
		caption === "" ? "Enlarged figure" : `Enlarged figure: ${caption}`,
	);
	const copy = image.cloneNode() as HTMLImageElement;
	for (const attribute of ["width", "height", "role", "tabindex", "aria-label"]) {
		copy.removeAttribute(attribute);
	}
	copy.style.removeProperty("width");
	const close = document.createElement("button");
	close.type = "button";
	close.textContent = "Close";
	close.autofocus = true;
	close.addEventListener("click", () => dialog.close());
	const label = document.createElement("p");
	label.textContent = caption;
	dialog.append(copy, label, close);
	dialog.addEventListener("click", (event) => {
		if (event.target === dialog) dialog.close();
	});
	dialog.addEventListener("close", () => {
		dialog.remove();
		image.focus();
	});
	return dialog;
}

/**
 * A figure in a gallery is small, and a detailed one is unreadable at that size. A figure's
 * image that the dialog would show larger opens enlarged in it, by click or from the keyboard.
 */
export const zoomableFigures: Attachment = (container) => {
	if (!(container instanceof HTMLElement)) return;
	const marked = [...container.querySelectorAll<HTMLImageElement>(zoomable)].filter(
		(image) => image.getBoundingClientRect().width < enlargedWidth(),
	);
	for (const image of marked) {
		image.tabIndex = 0;
		image.setAttribute("role", "button");
		image.setAttribute(
			"aria-label",
			`Enlarge the figure${image.alt === "" ? "" : `: ${image.alt}`}`,
		);
	}
	const open = (event: Event) => {
		const image = event.target;
		if (!(image instanceof HTMLImageElement) || !marked.includes(image)) return;
		event.preventDefault();
		const caption = image.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";
		const dialog = enlarged(image, caption);
		container.append(dialog);
		dialog.showModal();
	};
	const onKey = (event: KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") open(event);
	};
	container.addEventListener("click", open);
	container.addEventListener("keydown", onKey);
	return () => {
		container.removeEventListener("click", open);
		container.removeEventListener("keydown", onKey);
		container.querySelector<HTMLDialogElement>("dialog.figure-zoom")?.close();
	};
};
