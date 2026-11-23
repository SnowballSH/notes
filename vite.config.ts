import { resolve, sep } from "node:path";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

const notesDirectory = resolve("notes");

const reloadOnNoteChange: Plugin = {
	name: "notes-typst-reload",
	configureServer({ watcher, ws }) {
		watcher.add(notesDirectory);
		const reload = (file: string) => {
			if (file.startsWith(`${notesDirectory}${sep}`)) ws.send({ type: "full-reload" });
		};
		for (const event of ["change", "add", "unlink"] as const) watcher.on(event, reload);
	},
};

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter({ fallback: "404.html" }),
			csp: {
				mode: "hash",
				directives: {
					"default-src": ["self"],
					"script-src": ["self"],
					"style-src": ["self", "unsafe-inline"],
					"img-src": ["self", "data:"],
					"font-src": ["self"],
					"connect-src": ["self"],
					"base-uri": ["none"],
					"form-action": ["none"],
				},
			},
		}),
		reloadOnNoteChange,
	],
	build: {
		assetsInlineLimit: 0,
	},
});
