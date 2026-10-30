# Agent instructions

notes is the source of [notes.snowballsh.com](https://notes.snowballsh.com):
academic lecture notes, as a static SvelteKit site styled with Foundation UI.
Hosting is documented in [`README.md`](README.md).

## Commands

| Command | What |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm run dev` | Dev server on :5173 |
| `pnpm run check` | Typecheck the Svelte and TypeScript sources |
| `pnpm run lint` | Check formatting and lint with Biome |
| `pnpm run format` | Format and apply safe lint fixes |
| `pnpm run build` | Static production build to `build/` |
| `scripts/smoke-image.sh IMAGE [ENGINE]` | Smoke-test a built container image |

pnpm is the only package manager here: `packageManager` in `package.json` pins
its version for local work, CI and the image. Never add `package-lock.json`.

Before every commit: `pnpm run check && pnpm run lint && pnpm run build`.

## Code and Technology Guidelines

- Prefer well-known libraries over lesser-known Github repos for dependencies.
- Prefer well-maintained open-source projects
- Code should be self-documenting. That is, you should not need to, and you should not, write comments explaining your code. Only do so for very non-trivial logic for certain lines. Any complicated overall design choice or logic should be documented in a markdown file instead.
- Prefer the latest version of all technologies (frameworks, languages, etc.).
- Use modern language features and practices.
- Format, lint, and test your code.
- Use good software engineering patterns, including OOP, abstractions, strict typing and contracts, write & review contracts/interfaces before implementation, concise functional programming whenever needed.
- Avoid "hacky" one-time fixes and write long-term solutions instead.
- Separate files into directories in meaningful ways. Separate logic into helper functions in meaningful ways. Use concise but meaningful variable and function names.
