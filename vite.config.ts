import { resolve } from "node:path";
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
	plugins: [tailwindcss(), sveltekit(), reloadOnNoteChange],
	build: {
		assetsInlineLimit: 0,
	},
});
