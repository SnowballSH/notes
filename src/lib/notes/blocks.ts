import type { Attachment } from "svelte/attachments";

export interface SavedBlocks {
	open: boolean[];
	scroll: number;
}

const storageKey = (path: string): string => `notes:blocks:${path}`;

export function parseSavedBlocks(text: string | null): SavedBlocks | undefined {
	if (text === null) return undefined;
	try {
		const { open, scroll } = JSON.parse(text) as Partial<SavedBlocks>;
		const valid =
			Array.isArray(open) &&
			open.every((state) => typeof state === "boolean") &&
			typeof scroll === "number";
		return valid ? { open, scroll } : undefined;
	} catch {
		return undefined;
	}
}

function read(path: string): SavedBlocks | undefined {
	try {
		return parseSavedBlocks(sessionStorage.getItem(storageKey(path)));
	} catch {
		return undefined;
	}
}

function write(path: string, saved: SavedBlocks): void {
	try {
		sessionStorage.setItem(storageKey(path), JSON.stringify(saved));
	} catch {}
}

export const blocksIn = (container: Element): HTMLDetailsElement[] => [
	...container.querySelectorAll<HTMLDetailsElement>("details:not(.reference-preview *)"),
];

export function setAllBlocks(container: Element, open: boolean): void {
	for (const block of blocksIn(container)) block.open = open;
}

let documentJustLoaded = true;

function cameBackToThisPage(): boolean {
	const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
	if (!entry || new URL(entry.name).pathname !== location.pathname) return false;
	return entry.type === "reload" || entry.type === "back_forward";
}

export const rememberBlocks: Attachment = (container) => {
	const path = location.pathname;
	const saved = read(path);
	const blocks = blocksIn(container);
	if (saved?.open.length === blocks.length) {
		for (const [index, block] of blocks.entries()) block.open = saved.open[index] ?? block.open;
		// The browser restored the scroll before the blocks reopened and shifted the page.
		if (documentJustLoaded && cameBackToThisPage()) {
			requestAnimationFrame(() => window.scrollTo(0, saved.scroll));
		}
	}
	documentJustLoaded = false;

	const save = () =>
		write(path, { open: blocksIn(container).map((block) => block.open), scroll: window.scrollY });
	container.addEventListener("toggle", save, true);
	window.addEventListener("pagehide", save);
	return () => {
		container.removeEventListener("toggle", save, true);
		window.removeEventListener("pagehide", save);
	};
};

const tallEnoughToNeedClosing = 0.6;

function closeButtonFor(block: HTMLDetailsElement): HTMLButtonElement {
	const name = block.querySelector("summary strong")?.textContent?.trim().toLowerCase() ?? "block";
	const button = document.createElement("button");
	button.type = "button";
	button.className = "close-block";
	button.textContent = `Close ${name}`;
	button.addEventListener("click", () => {
		block.open = false;
		const summary = block.querySelector("summary");
		summary?.scrollIntoView({ block: "nearest" });
		summary?.focus();
	});
	return button;
}

export const closableBlocks: Attachment = (container) => {
	const offerClosing = (block: HTMLDetailsElement) => {
		const existing = block.querySelector(":scope > .close-block");
		const needed =
			block.open &&
			block.getBoundingClientRect().height > window.innerHeight * tallEnoughToNeedClosing;
		if (needed && !existing) block.append(closeButtonFor(block));
		if (!needed) existing?.remove();
	};
	const onToggle = (event: Event) => {
		const isCopy = event.target instanceof Element && event.target.closest(".reference-preview");
		if (event.target instanceof HTMLDetailsElement && !isCopy) offerClosing(event.target);
	};
	for (const block of blocksIn(container)) offerClosing(block);
	container.addEventListener("toggle", onToggle, true);
	return () => container.removeEventListener("toggle", onToggle, true);
};
