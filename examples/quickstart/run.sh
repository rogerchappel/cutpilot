#!/usr/bin/env bash
set -euo pipefail

example_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$example_root/../.." && pwd)"
cli="$repo_root/dist/src/cli.js"

if [ ! -f "$cli" ]; then
  printf 'Missing built CLI. Run `pnpm build` from the repo root first.\n' >&2
  exit 1
fi

cd "$example_root"

# Placeholder only: inspect uses probe-fixture.json, and render is dry-run.
: > take01.mp4

node "$cli" init --root .
cp ./transcript-fixture.json ./.cutpilot/transcripts/take01.json
node "$cli" inspect --root . --probe-json ./probe-fixture.json
node "$cli" edl create --root . --preset short-15 --title "Cutpilot demo short"
node "$cli" edl validate --root .
node "$cli" artifacts --root .
node "$cli" render --root . --dry-run

printf '\nExample complete. Inspect .cutpilot/edl and .cutpilot/artifacts.\n'
