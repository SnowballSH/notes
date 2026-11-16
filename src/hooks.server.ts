import type { HandleServerError } from "@sveltejs/kit/hooks";
import { TypstError } from "#lib/server/typst/cli.ts";
import { dev } from "$app/env";

/**
 * What Typst reported is printed where the author is looking: in the terminal always, and
 * on the error page while developing.
 */
export const handleError: HandleServerError = ({ error }) => {
	if (!(error instanceof TypstError)) return;
	console.error(error.message);
	if (dev) return { message: error.message };
};
