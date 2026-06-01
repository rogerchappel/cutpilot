# EDL Contract

cutpilot EDL files are small JSON documents meant to be readable by humans and agents.

## Required Fields

- `version`: must be `1`.
- `title`: human-readable edit title.
- `preset`: one of `short-15`, `carousel`, or `talking-head-cleanup`.
- `aspect`: one of `9:16`, `1:1`, or `16:9`.
- `segments`: ordered array of source ranges.

## Segment Fields

- `id`: stable segment id, for example `s01`.
- `source`: path relative to the footage workspace root.
- `start`: source start in seconds.
- `end`: source end in seconds.
- `role`: optional beat label such as `hook`, `proof`, `cta`, or `cleanup`.
- `text`: optional transcript excerpt.
- `reason`: optional agent note explaining the cut.

Segments must stay inside probed source durations. When transcript word data exists, segment edges should align to word starts and ends.

## Overlay Fields

Overlays are intentionally simple in this release. Agents may use them as planning metadata even when the renderer does not burn every overlay type yet.

- `id`: stable overlay id.
- `start`: output timeline start in seconds.
- `end`: output timeline end in seconds.
- `type`: `caption`, `title`, `image`, or `video`.
- `text`: optional text payload.
- `file`: optional local media path.

## Diagnostics

Validation appends diagnostics:

- `error`: must be fixed before render.
- `warning`: should be reviewed, especially word-boundary warnings.
- `info`: timeline facts such as expected duration.
