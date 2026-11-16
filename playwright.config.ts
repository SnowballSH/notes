import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
	testDir: "tests/e2e",
	testMatch: "*.e2e.ts",
	fullyParallel: false,
	workers: 1,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: { baseURL: `http://127.0.0.1:${port}`, trace: "retain-on-failure" },
	webServer: {
		command: `pnpm run build && pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort`,
		url: `http://127.0.0.1:${port}/`,
		reuseExistingServer: false,
		timeout: 180_000,
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
	],
});
