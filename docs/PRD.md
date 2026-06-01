# PRD

## Problem

Local agents can reason about video edits, but they need compact artifacts instead of raw frames: source metadata, transcript-aware cut candidates, a clear EDL, and a render plan that can be dry-run before touching media.

## Goals

- Provide a local-first TypeScript CLI for agent-assisted video editing.
- Initialize an edit workspace next to user footage without modifying source videos.
- Inspect source videos through ffprobe-compatible metadata.
- Create and validate a simple EDL.
- Prefer word-boundary-aware cuts when transcript data exists.
- Plan ffmpeg render commands and optionally execute them.
- Emit packed transcript notes, diagnostics, and an agent brief.
- Include a reusable skill for local agents.

## Non-Goals

- SaaS workflows, accounts, billing, auth, hosted queues, or cloud rendering.
- Premium generation pipelines.
- Full nonlinear editor replacement.
- Complex overlay/compositing DSL in the first release.

## Users

- Developers and creators using local coding agents to edit short videos.
- Maintainers who want inspectable JSON and shell-command render plans.

## Release Bar

- `pnpm build`, `pnpm test`, and `bash scripts/validate.sh` pass.
- README documents commands and release posture.
- Skill instructions exist under `skills/cutpilot/SKILL.md`.
- Publishing remains disabled unless explicitly requested.
