import { resolve } from "node:path";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

const reloadOnNoteChange: Plugin = {
	name: "notes-typst-reload",
	configureServer({ watcher, ws }) {
		watcher.add(resolve("notes"));
		watcher.on("change", (file) => {
			if (file.endsWith(".typ")) ws.send({ type: "full-reload" });
		});
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
