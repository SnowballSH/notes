import type { HandleServerError } from "@sveltejs/kit/hooks";
import { OutlineError } from "#lib/outlines/contents.ts";
import { TypstError } from "#lib/server/typst/cli.ts";
import { dev } from "$app/env";

export const handleError: HandleServerError = ({ error }) => {
	if (!(error instanceof TypstError || error instanceof OutlineError)) return;
	console.error(error.message);
	if (dev) return { message: error.message };
};
