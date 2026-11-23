import type { Attachment } from "svelte/attachments";

const zoomable = "figure img:not(a img, .reference-preview *, .figure-zoom *)";

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
		if (image.isConnected) image.focus();
	});
	return dialog;
}

const buttonAttributes = { role: "button", tabindex: "0" } as const;

function mark(image: HTMLImageElement): void {
	const width = image.getBoundingClientRect().width;
	const enlarges = width > 0 && width < enlargedWidth();
	if (enlarges === (image.getAttribute("role") === "button")) return;
	for (const [name, value] of Object.entries(buttonAttributes)) {
		if (enlarges) image.setAttribute(name, value);
		else image.removeAttribute(name);
	}
	if (enlarges) {
		image.setAttribute(
			"aria-label",
			`Enlarge the figure${image.alt === "" ? "" : `: ${image.alt}`}`,
		);
	} else {
		image.removeAttribute("aria-label");
	}
}

export const zoomableFigures: Attachment = (container) => {
	if (!(container instanceof HTMLElement)) return;
	const markAll = () => {
		for (const image of container.querySelectorAll<HTMLImageElement>(zoomable)) mark(image);
	};
	const observer = new ResizeObserver(markAll);
	observer.observe(container);
	const open = (event: Event) => {
		const image = event.target;
		if (!(image instanceof HTMLImageElement) || !image.matches(`${zoomable}[role="button"]`))
			return;
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
	container.addEventListener("load", markAll, true);
	window.addEventListener("resize", markAll);
	return () => {
		observer.disconnect();
		window.removeEventListener("resize", markAll);
		container.removeEventListener("click", open);
		container.removeEventListener("keydown", onKey);
		container.removeEventListener("load", markAll, true);
		container.querySelector<HTMLDialogElement>("dialog.figure-zoom")?.close();
	};
};
