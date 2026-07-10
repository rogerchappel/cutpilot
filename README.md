# cutpilot

cutpilot is a local-first CLI and agent skill layer for building small, inspectable video edits from local footage. It creates a simple EDL, validates the timeline, plans ffmpeg commands, and writes agent-friendly artifacts such as packed transcript notes and diagnostics.

It is inspired by transcript-first editing workflows, but intentionally smaller: no SaaS, no auth, no billing, no cloud queue, and no proprietary generation pipeline.


## Quickstart

Run the tool from a fresh checkout:

```sh
npm install
npm run build
node dist/src/cli.js --help
npm test
```

The help command is a quick smoke test for the CLI entrypoint, and `npm test` runs the committed regression suite before you depend on the output.

## Install

```sh
pnpm install
pnpm build
```

## Quick Start

```sh
cd /path/to/footage
cutpilot init
cutpilot inspect
cutpilot edl create --preset short-15 --title "Launch short"
cutpilot edl validate
cutpilot render --dry-run
cutpilot artifacts
```

For a no-media demo that uses mocked probe metadata and a transcript fixture:

```sh
pnpm build
bash examples/quickstart/run.sh
```

If `ffprobe` is not available during tests or agent planning, pass mock ffprobe output:

```sh
cutpilot inspect --probe-json ./probe-fixtures.json
```

## Limitations

- cutpilot plans and validates local edits; it is not a hosted editor, renderer
  queue, asset manager, or transcription service.
- Real rendering depends on local `ffmpeg`/`ffprobe` availability and codec
  support. Use `render --dry-run` to inspect commands before executing them.
- Transcript alignment is only as accurate as the transcript timing supplied in
  `.cutpilot/transcripts/`.
- Generated EDLs are first-pass editing plans. Review segment choices, rights,
  captions, and export settings before publishing a cut.

## Commands

- `cutpilot init` creates `.cutpilot/` with edit, render, transcript, artifact, temp, and preset folders.
- `cutpilot inspect` scans local video files and writes `.cutpilot/manifest.json`.
- `cutpilot presets` lists `short-15`, `carousel`, and `talking-head-cleanup`.
- `cutpilot edl create` creates a first-pass EDL from source metadata and optional transcripts.
- `cutpilot edl validate` checks source bounds, duration, and transcript word-boundary alignment.
- `cutpilot render --dry-run` emits an ffmpeg command plan without rendering.
- `cutpilot render` executes the ffmpeg plan locally.
- `cutpilot artifacts` writes packed transcript notes, timeline diagnostics, and an agent brief.
- `cutpilot schema` prints the EDL contract.

## Transcript Format

Add optional transcripts at `.cutpilot/transcripts/<source-basename>.json`:

```json
{
  "words": [
    { "start": 0.42, "end": 0.8, "text": "This" },
    { "start": 0.81, "end": 1.1, "text": "works" }
  ]
}
```

When transcripts exist, cutpilot aligns generated segment edges to word boundaries and warns when a manually edited EDL cuts inside a word.

## EDL Shape

The EDL is JSON:

```json
{
  "version": 1,
  "title": "Launch short",
  "preset": "short-15",
  "aspect": "9:16",
  "targetSeconds": 15,
  "segments": [
    {
      "id": "s01",
      "source": "take01.mp4",
      "start": 0.42,
      "end": 3.72,
      "role": "hook",
      "text": "This works",
      "reason": "Selected from transcript word boundaries."
    }
  ]
}
```

See `docs/EDL.md` for the contract.

## Agent Skill

`skills/cutpilot/SKILL.md` contains a workflow for Codex, Claude, and OpenClaw-style local agents. The skill focuses on viral-style carousels and 15-second shorts from local footage while keeping user footage untouched.

## Verify

```sh
bash scripts/validate.sh
```

The validation script runs local package checks and optional `agent-qc ready` when installed.

## Release Posture

Release docs and ReleaseBox config are scaffolded, but publishing is disabled unless a maintainer explicitly enables it. Do not push, tag, or publish from automation without an explicit instruction.

## Verification

Use the package scripts as the public smoke gates before publishing or changing CLI behavior.

- `npm run release:check`
- `npm run test`
- `npm run smoke`
- `npm run check`
## Release readiness

Run the same checks expected before opening or cutting a release:

```sh
npm run check
npm run test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

Use `npm pack --dry-run` to confirm the published package contains the CLI/runtime files plus README, license, security, support, and release notes.

## Limitations and safety

- cutpilot plans local edits and ffmpeg commands; it does not judge whether a clip is legally or contractually safe to publish. Review source rights, consent, and platform rules before rendering or sharing.
- The generated EDL is a starting point. Inspect transcript-aligned cuts, source bounds, and dry-run ffmpeg commands before running a real render.
- Mock probe data is for tests and planning only. Use real ffprobe output before relying on duration, codec, or resolution decisions for a final edit.
- Automation should keep original footage read-only and write outputs under the project workspace so cleanup remains reversible.

## License
MIT
