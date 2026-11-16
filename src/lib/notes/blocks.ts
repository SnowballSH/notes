import type { Attachment } from "svelte/attachments";

/** Which collapsible blocks of a page were open, in document order, and where the page was scrolled. */
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

const blocksIn = (container: Element): HTMLDetailsElement[] => [
	...container.querySelectorAll<HTMLDetailsElement>("details"),
];

export function setAllBlocks(container: Element, open: boolean): void {
	for (const block of blocksIn(container)) block.open = open;
}

let documentJustLoaded = true;

function cameBackToDocument(): boolean {
	const [entry] = performance.getEntriesByType("navigation");
	const type = (entry as PerformanceNavigationTiming | undefined)?.type;
	return type === "reload" || type === "back_forward";
}

/**
 * Proofs the reader opened stay open for the session: when they come back to the page, and
 * when it reloads. After a reload the browser restores the scroll position before the
 * proofs reopen, so the position is restored again once the page has settled.
 */
export const rememberBlocks: Attachment = (container) => {
	const path = location.pathname;
	const saved = read(path);
	const blocks = blocksIn(container);
	if (saved?.open.length === blocks.length) {
		for (const [index, block] of blocks.entries()) block.open = saved.open[index] ?? block.open;
		if (documentJustLoaded && cameBackToDocument()) {
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

/**
 * A long proof can otherwise only be closed from its heading, a scroll away. An open block
 * taller than most of the window gets a button at its end that closes it.
 */
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
		if (event.target instanceof HTMLDetailsElement) offerClosing(event.target);
	};
	for (const block of blocksIn(container)) offerClosing(block);
	container.addEventListener("toggle", onToggle, true);
	return () => container.removeEventListener("toggle", onToggle, true);
};
