# Orchestration

Cutpilot is intentionally local-first. The CLI coordinates a small set of filesystem artifacts rather than a hosted job queue.

## Flow

1. Create or reuse a workspace with `cutpilot init`.
2. Place source media and optional transcript data in the workspace.
3. Inspect media metadata with `cutpilot inspect`.
4. Generate an EDL with `cutpilot edl create`.
5. Validate the EDL with `cutpilot edl validate`.
6. Generate agent artifacts with `cutpilot artifacts`.
7. Preview the render plan with `cutpilot render --dry-run`.
8. Render locally with `cutpilot render`.

## Agent Contract

Agents should treat the EDL as the source of truth for edits. Transcript-derived artifacts are advisory and are used to choose cuts, captions, and pacing.

The current implementation keeps orchestration synchronous and deterministic. Future versions may add queue adapters or hosted runners, but the v0.1.0 contract stays portable: workspace files in, EDL and render artifacts out.
