# notes

The source of [notes.snowballsh.com](https://notes.snowballsh.com): academic
lecture notes written in [Typst](https://typst.app) and published as a static
[SvelteKit](https://svelte.dev/docs/kit) site, styled with
[Foundation UI](https://github.com/SnowballSH/foundationui).

Each note is one Typst file. At build time it is compiled to an HTML page and
a PDF, and its interactive figures (widgets) are mounted as Svelte components.
The site also has course outlines, full-text search, light and dark themes and
a sitemap.

## Requirements

- Node.js 26 or later
- pnpm, at the version pinned by `packageManager` in `package.json`
- The `typst` CLI on `PATH`, at the version pinned in
  `src/lib/server/typst/cli.ts`

## Getting started

```bash
pnpm install
pnpm run dev
```

The dev server runs on <http://localhost:5173> and also serves draft notes and
the widget gallery at `/dev/widgets`.

| Command                                        | What                                              |
| ---------------------------------------------- | ------------------------------------------------- |
| `pnpm run dev`                                 | Dev server                                        |
| `pnpm run build`                               | Static production build to `build/`               |
| `pnpm run check`                               | Typecheck the Svelte and TypeScript sources       |
| `pnpm run lint`                                | Check formatting and lint with Biome              |
| `pnpm run format`                              | Format and apply safe lint fixes                  |
| `pnpm run test`                                | Unit tests with Vitest                            |
| `pnpm run test:e2e`                            | Build, then test the site in Chromium and Firefox |
| `pnpm run new:note <course> <slug> <title...>` | Create a draft note from a template               |
| `pnpm run new:widget <name>`                   | Create a widget in `src/lib/widgets/<name>/`      |

## Layout

| Path                | Contents                                                   |
| ------------------- | ---------------------------------------------------------- |
| `notes/`            | The notes, one directory per course, and the Typst library |
| `src/lib/outlines/` | Course outlines: chapters, section summaries and sources   |
| `src/lib/server/`   | The build-time pipeline from Typst to HTML and PDF         |
| `src/lib/widgets/`  | Interactive widgets, each with its logic and unit tests    |
| `src/routes/`       | Pages, search index and sitemap                            |
| `tests/e2e/`        | Playwright tests, including accessibility checks           |
| `docs/`             | Guides for authors and contributors                        |

## Documentation

- [`docs/writing-notes.md`](docs/writing-notes.md): add and edit notes, keep
  drafts, start a course.
- [`docs/widgets.md`](docs/widgets.md): write an interactive widget.
- [`docs/notes-system.md`](docs/notes-system.md): how notes become pages.

## Container image

`Containerfile` builds an image that serves the static site with Caddy on port
8080, with health checks at `/health/live` and `/health/ready`. It runs as
`10001:10001` with a read-only root. `scripts/smoke-image.sh IMAGE` checks a
built image. Pushing to `main` publishes it as `ghcr.io/snowballsh/notes`.
