# notes

The source of [notes.snowballsh.com](https://notes.snowballsh.com): academic
lecture notes, as a static SvelteKit site styled with
[Foundation UI](https://github.com/SnowballSH/foundationui).

```bash
npm ci
npm run dev
npm run check && npm run lint && npm run build
```

Pushing to `main` publishes `ghcr.io/snowballsh/notes`. The image is Caddy
serving the static build on port 8080, with `/health/live` and `/health/ready`.
It runs as `10001:10001` with a read-only root. SnowSys deploys it through
snowdeploy (`deploy/manifests/notes.yaml` in the snowsys repository).
