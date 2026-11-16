import { mount, unmount } from "svelte";
import type { Attachment } from "svelte/attachments";
import { loadWidget } from "./registry";

type Destroy = () => void;

async function mountWidget(target: HTMLElement): Promise<Destroy> {
	const name = target.getAttribute("name") ?? "";
	const fallback = [...target.childNodes];
	try {
		const component = await loadWidget(name);
		const props = JSON.parse(target.getAttribute("props") ?? "{}");
		target.replaceChildren();
		const instance = mount(component, { target, props });
		target.setAttribute("data-mounted", "");
		return () => void unmount(instance);
	} catch (cause) {
		console.error(`The ${name} widget did not load; its fallback stays.`, cause);
		target.replaceChildren(...fallback);
		target.setAttribute("data-failed", "");
		return () => {};
	}
}

export const widgets: Attachment = (container) => {
	const mounted = [...container.querySelectorAll<HTMLElement>("notes-widget")].map(mountWidget);
	return () => {
		for (const widget of mounted) widget.then((destroy) => destroy());
	};
};
