# notes

The source of [notes.snowballsh.com](https://notes.snowballsh.com): academic
lecture notes, as a static SvelteKit site styled with
[Foundation UI](https://github.com/SnowballSH/foundationui).

```bash
pnpm install
pnpm run dev
pnpm run check && pnpm run lint && pnpm run test && pnpm run build
```

- [`docs/writing-notes.md`](docs/writing-notes.md): add and edit notes, keep
  drafts, start a course. `pnpm run new:note` creates one.
- [`docs/widgets.md`](docs/widgets.md): write an interactive widget.
  `pnpm run new:widget` creates one, and `/dev/widgets` shows them while
  developing.
- [`docs/notes-system.md`](docs/notes-system.md): how notes become pages.

Pushing to `main` publishes `ghcr.io/snowballsh/notes`. The image is Caddy
serving the static build on port 8080, with `/health/live` and `/health/ready`.
It runs as `10001:10001` with a read-only root.
