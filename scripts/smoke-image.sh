#!/usr/bin/env bash
set -Eeuo pipefail

# Runs the image the way SnowSys does (read-only root, tmpfs, no capabilities)
# and asserts what the deployment depends on.
#   scripts/smoke-image.sh <image> [container engine]

image="$1"
engine="${2:-docker}"
name="notes-smoke-$$"
port=18080
body="$(mktemp)"

cleanup() {
  "${engine}" rm -f "${name}" >/dev/null 2>&1 || true
  rm -f -- "${body}"
}
trap cleanup EXIT

"${engine}" run -d --name "${name}" -p "127.0.0.1:${port}:8080" \
  --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --tmpfs /config --tmpfs /data --tmpfs /tmp "${image}" >/dev/null

expect() {
  local path="$1" want="$2" code
  code="$(curl -s -o "${body}" -w '%{http_code}' "http://127.0.0.1:${port}${path}")"
  [[ "${code}" == "${want}" ]] || {
    printf 'FAIL %s answered %s, wanted %s\n' "${path}" "${code}" "${want}" >&2
    "${engine}" logs "${name}" >&2
    exit 1
  }
  printf 'ok   %s %s\n' "${path}" "${code}"
}

for _ in $(seq 1 30); do
  curl -fs -o /dev/null "http://127.0.0.1:${port}/health/ready" && break
  sleep 1
done

expect /health/live 200
expect /health/ready 200
expect / 200
grep -q '<title>Notes</title>' "${body}" || {
  printf 'FAIL the home page has no Notes title\n' >&2
  exit 1
}
expect /absent 404
grep -q 'Not Found' "${body}" || grep -q '_app/' "${body}" || {
  printf 'FAIL the 404 is not the site page\n' >&2
  exit 1
}
curl -fsI "http://127.0.0.1:${port}/" | grep -qi "^content-security-policy: frame-ancestors 'none'" || {
  printf 'FAIL the frame-ancestors header is absent\n' >&2
  exit 1
}
printf 'image smoke passed\n'
