import { mount, unmount } from "svelte";
import type { Attachment } from "svelte/attachments";
import { loadWidget } from "./registry";

type Destroy = () => void;

async function mountWidget(target: Element): Promise<Destroy> {
	const name = target.getAttribute("name") ?? "";
	try {
		const component = await loadWidget(name);
		const props = JSON.parse(target.getAttribute("props") ?? "{}");
		target.replaceChildren();
		target.setAttribute("data-mounted", "");
		const instance = mount(component, { target, props });
		return () => void unmount(instance);
	} catch (cause) {
		console.error(`The ${name} widget did not load; its fallback stays.`, cause);
		return () => {};
	}
}

export const widgets: Attachment = (container) => {
	const mounted = [...container.querySelectorAll("notes-widget")].map(mountWidget);
	return () => {
		for (const widget of mounted) widget.then((destroy) => destroy());
	};
};
