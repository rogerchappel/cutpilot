# Cutpilot Quickstart Example

This is a no-media smoke example for checking the Cutpilot workflow without needing
`ffprobe`, `ffmpeg`, or real footage.

It uses:

- a placeholder `take01.mp4` filename
- mocked ffprobe metadata in `probe-fixture.json`
- a word-level transcript in `transcript-fixture.json`

## Run

From the repository root:

```sh
pnpm install
pnpm build
bash examples/quickstart/run.sh
```

The script writes a local `.cutpilot/` workspace inside this example directory.
It copies `transcript-fixture.json` into `.cutpilot/transcripts/take01.json`
before creating the EDL.

## Inspect

After running, check:

```sh
cat examples/quickstart/.cutpilot/edl/short-15.json
cat examples/quickstart/.cutpilot/artifacts/takes_packed.md
cat examples/quickstart/.cutpilot/artifacts/timeline_diagnostics.md
```

The render command is run with `--dry-run`, so it prints the ffmpeg command plan
without writing video.

## Using Real Footage

Replace `take01.mp4` with a real video file of the same name, then run:

```sh
node ../../dist/src/cli.js render --root . --output .cutpilot/renders/final.mp4
```
