import type { Attachment } from "svelte/attachments";

const hoverDelay = 250;
const leaveDelay = 200;
const gap = 8;

/** The block a reference points at, when it is one worth previewing: a card, a figure or an equation. */
function referenced(link: HTMLAnchorElement, container: Element): HTMLElement | undefined {
	const id = decodeURIComponent(link.hash.slice(1));
	const target = id === "" ? null : document.getElementById(id);
	if (!(target instanceof HTMLElement) || !container.contains(target)) return undefined;
	if (target.contains(link)) return undefined;
	if (target.matches(".card, figure")) return target;
	return target.closest<HTMLElement>(".equation") ?? undefined;
}

function copyOf(target: HTMLElement): HTMLElement {
	const copy = target.cloneNode(true) as HTMLElement;
	for (const element of [copy, ...copy.querySelectorAll("[id]")]) element.removeAttribute("id");
	for (const button of copy.querySelectorAll(".close-block")) button.remove();
	if (copy instanceof HTMLDetailsElement) copy.open = true;
	return copy;
}

function place(preview: HTMLElement, link: HTMLElement, container: HTMLElement): void {
	const bounds = container.getBoundingClientRect();
	const anchor = link.getBoundingClientRect();
	const height = preview.offsetHeight;
	const roomBelow = window.innerHeight - anchor.bottom;
	const above = roomBelow < height + gap && anchor.top > roomBelow;
	const top = above ? anchor.top - height - gap : anchor.bottom + gap;
	preview.style.top = `${top - bounds.top}px`;
}

/**
 * A reference such as "Proposition 1" shows the block it points at beside the reader's
 * place, so they need not jump away and find their line again. A mouse shows it on hover
 * and a keyboard on focus, and following the link still jumps. On a touch screen the first
 * tap shows it, with a link to go there.
 */
export const referencePreviews: Attachment = (container) => {
	if (!(container instanceof HTMLElement)) return;
	const preview = document.createElement("aside");
	preview.className = "reference-preview";
	preview.id = "reference-preview";
	preview.hidden = true;
	container.append(preview);

	let shownFor: HTMLAnchorElement | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const hide = () => {
		clearTimeout(timer);
		shownFor?.removeAttribute("aria-describedby");
		shownFor = undefined;
		preview.hidden = true;
		preview.replaceChildren();
	};

	const show = (link: HTMLAnchorElement, withLink: boolean) => {
		const target = referenced(link, container);
		if (!target || shownFor === link) return;
		hide();
		preview.append(copyOf(target));
		if (withLink) {
			const go = document.createElement("a");
			go.href = link.hash;
			go.className = "reference-go";
			go.textContent = `Go to ${link.textContent?.trim() ?? "it"}`;
			go.addEventListener("click", () => setTimeout(hide));
			preview.append(go);
		}
		preview.hidden = false;
		place(preview, link, container);
		link.setAttribute("aria-describedby", preview.id);
		shownFor = link;
	};

	const linkOf = (event: Event): HTMLAnchorElement | undefined => {
		const link = event.target instanceof Element ? event.target.closest("a") : null;
		const isReference = link?.getAttribute("href")?.startsWith("#") && !preview.contains(link);
		return isReference && link instanceof HTMLAnchorElement ? link : undefined;
	};

	const later = (action: () => void, delay: number) => {
		clearTimeout(timer);
		timer = setTimeout(action, delay);
	};

	const onOver = (event: PointerEvent) => {
		if (event.pointerType !== "mouse") return;
		if (preview.contains(event.target as Node)) return clearTimeout(timer);
		const link = linkOf(event);
		if (link) later(() => show(link, false), hoverDelay);
	};
	const onOut = (event: PointerEvent) => {
		if (event.pointerType !== "mouse") return;
		if (linkOf(event) || preview.contains(event.target as Node)) later(hide, leaveDelay);
	};
	const onFocus = (event: FocusEvent) => {
		const link = linkOf(event);
		if (link?.matches(":focus-visible")) show(link, false);
	};
	const onBlur = (event: FocusEvent) => {
		const movedIntoPreview =
			event.relatedTarget instanceof Node && preview.contains(event.relatedTarget);
		if (linkOf(event) === shownFor && !movedIntoPreview) hide();
	};
	let touched = false;
	const onDown = (event: PointerEvent) => {
		touched = event.pointerType === "touch";
		if (!preview.contains(event.target as Node) && !linkOf(event)) hide();
	};
	const onClick = (event: MouseEvent) => {
		const link = linkOf(event);
		if (!link) return;
		if (!touched || shownFor === link || !referenced(link, container)) return hide();
		event.preventDefault();
		show(link, true);
	};
	const onKey = (event: KeyboardEvent) => {
		if (event.key === "Escape") hide();
	};

	container.addEventListener("pointerover", onOver);
	container.addEventListener("pointerout", onOut);
	container.addEventListener("focusin", onFocus);
	container.addEventListener("focusout", onBlur);
	container.addEventListener("click", onClick);
	document.addEventListener("pointerdown", onDown);
	document.addEventListener("keydown", onKey);
	return () => {
		hide();
		preview.remove();
		container.removeEventListener("pointerover", onOver);
		container.removeEventListener("pointerout", onOut);
		container.removeEventListener("focusin", onFocus);
		container.removeEventListener("focusout", onBlur);
		container.removeEventListener("click", onClick);
		document.removeEventListener("pointerdown", onDown);
		document.removeEventListener("keydown", onKey);
	};
};
