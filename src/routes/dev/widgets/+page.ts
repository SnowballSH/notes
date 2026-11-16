import { error } from "@sveltejs/kit";
import { dev } from "$app/env";
import type { PageLoad } from "./$types";

export const prerender = false;

/** The playground is imported only while developing, so the production site never loads it. */
export const load: PageLoad = async () => {
	if (dev) return { Playground: (await import("./Playground.svelte")).default };
	error(404, "Not Found");
};
