---
name: cutpilot
description: Use cutpilot to turn local footage into simple transcript-aware EDLs, 15-second shorts, and carousel-style social edits with ffmpeg dry-run planning and pre-render checks.
---

# cutpilot Skill

Use this skill when the user wants a local video edit from footage on disk and wants an agent to plan or execute the edit.

## Boundaries

- Keep source footage untouched.
- Write outputs only in the footage folder's `.cutpilot/` directory unless the user asks for a different output path.
- Ask before publishing, uploading, posting, or sending rendered media anywhere.
- Confirm the edit strategy before rendering final media.

## Workflow

1. Run `cutpilot init` in the footage directory.
2. Run `cutpilot inspect`. If ffprobe is unavailable but metadata was provided, use `cutpilot inspect --probe-json <file>`.
3. Look for transcripts in `.cutpilot/transcripts/`. If none exist, explain that generated cuts will be duration-based and can be improved with word timestamps.
4. Pick a preset:
   - `short-15`: vertical hook, proof, payoff, CTA.
   - `carousel`: square or social sequence with beat-card overlays.
   - `talking-head-cleanup`: longer cleanup pass for dead space and filler.
5. Run `cutpilot edl create --preset <preset> --title "<title>"`.
6. Read the EDL and diagnostics. Manually adjust the EDL if needed.
7. Run `cutpilot edl validate`.
8. Run `cutpilot render --dry-run` and inspect the ffmpeg plan.
9. Render only after strategy confirmation: `cutpilot render`.
10. Run `cutpilot artifacts` after EDL changes so future agents can resume.

## Viral-Style 15-Second Short Pattern

- Start with the strongest concrete claim or visual hook.
- Keep 3 to 6 segments.
- Prefer word-boundary cuts from transcript data.
- Trim silence aggressively, but do not cut inside words.
- End on a clear payoff or action.
- Use `render --dry-run` before any final render.

## Carousel Pattern

- Treat each EDL segment as a card-like beat.
- Keep one idea per beat.
- Use overlay metadata for titles, but verify whether the current renderer burns those overlays before promising final graphics.
- Keep text short enough for mobile viewing.

## Talking-Head Cleanup Pattern

- Preserve meaning and cadence.
- Remove long dead air, false starts, and repeated restarts.
- Keep natural reactions when they carry the point.
- Run validation after every manual timing edit.

## Pre-Render Self-Check

- EDL has no `error` diagnostics.
- Word-boundary warnings have been reviewed.
- Expected duration matches the user's target.
- ffmpeg command plan points only at local footage and `.cutpilot/tmp`.
- Output path is intentional.

## Agent Artifacts

Use `cutpilot artifacts` to produce:

- `.cutpilot/artifacts/takes_packed.md`
- `.cutpilot/artifacts/timeline_diagnostics.md`
- `.cutpilot/artifacts/agent_brief.md`

Read these first when resuming an existing edit.
