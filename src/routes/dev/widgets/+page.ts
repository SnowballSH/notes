import { error } from "@sveltejs/kit";
import { dev } from "$app/env";
import type { PageLoad } from "./$types";

export const prerender = false;

// Imported only while developing, so the production site never loads the playground.
export const load: PageLoad = async () => {
	if (dev) return { Playground: (await import("./Playground.svelte")).default };
	error(404, "Not Found");
};
