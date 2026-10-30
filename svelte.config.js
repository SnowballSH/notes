import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
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
	},
};

export default config;
