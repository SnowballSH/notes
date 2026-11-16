import type { Attachment } from "svelte/attachments";

function enlarged(image: HTMLImageElement, caption: string): HTMLDialogElement {
	const dialog = document.createElement("dialog");
	dialog.className = "figure-zoom";
	dialog.setAttribute(
		"aria-label",
		caption === "" ? "Enlarged figure" : `Enlarged figure: ${caption}`,
	);
	const copy = image.cloneNode() as HTMLImageElement;
	copy.removeAttribute("width");
	copy.removeAttribute("height");
	copy.style.removeProperty("width");
	const close = document.createElement("button");
	close.type = "button";
	close.textContent = "Close";
	close.addEventListener("click", () => dialog.close());
	const label = document.createElement("p");
	label.textContent = caption;
	dialog.append(copy, label, close);
	dialog.addEventListener("click", (event) => {
		if (event.target === dialog) dialog.close();
	});
	dialog.addEventListener("close", () => dialog.remove());
	return dialog;
}

/**
 * A figure in a gallery is small, and a detailed one is unreadable at that size. Each
 * figure's image opens enlarged in a dialog, by click or from the keyboard.
 */
export const zoomableFigures: Attachment = (container) => {
	const images = [...container.querySelectorAll<HTMLImageElement>("figure img")];
	const open = (image: HTMLImageElement) => {
		const caption = image.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";
		const dialog = enlarged(image, caption);
		container.append(dialog);
		dialog.showModal();
	};
	const onClick = (event: Event) => {
		if (event.currentTarget instanceof HTMLImageElement) open(event.currentTarget);
	};
	const onKey = (event: KeyboardEvent) => {
		if (event.key !== "Enter" && event.key !== " ") return;
		event.preventDefault();
		onClick(event);
	};
	for (const image of images) {
		image.tabIndex = 0;
		image.setAttribute("role", "button");
		image.setAttribute(
			"aria-label",
			`Enlarge the figure${image.alt === "" ? "" : `: ${image.alt}`}`,
		);
		image.addEventListener("click", onClick);
		image.addEventListener("keydown", onKey);
	}
	return () => {
		for (const image of images) {
			image.removeEventListener("click", onClick);
			image.removeEventListener("keydown", onKey);
		}
	};
};
