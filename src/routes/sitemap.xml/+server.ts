import { noteHref } from "#lib/notes/names.ts";
import { publishedNotes } from "#lib/server/typst/notes.ts";
import { courses, outlineHref } from "#lib/site/courses.ts";
import { siteOrigin } from "#lib/site/title.ts";
import type { RequestHandler } from "./$types";

export const prerender = true;

export const GET: RequestHandler = async () => {
	const paths = ["/", ...courses.map(outlineHref), ...(await publishedNotes()).map(noteHref)];
	const urls = paths.map((path) => `  <url><loc>${siteOrigin}${path}</loc></url>`).join("\n");
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { "content-type": "application/xml" } },
	);
};
