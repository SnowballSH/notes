import { defineParams } from "@sveltejs/kit/params";
import { isCategorySlug } from "#lib/site/categories.ts";

export const params = defineParams({
	category: (param) => (isCategorySlug(param) ? param : undefined),
});
