import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRenderPlan, createEdl, initWorkspace, inspectWorkspace, packTranscripts, validateEdl } from '../src/index.js';
import { readJson } from '../src/fs.js';
import type { Edl, WorkspaceManifest } from '../src/types.js';

test('inspectWorkspace reads ffprobe-compatible fixture metadata', async () => {
  const root = await makeWorkspace();
  await writeFile(path.join(root, 'take01.mp4'), '');
  const fixture = path.resolve('fixtures/probe-fixture.json');
  const manifest = await inspectWorkspace(root, { probeJson: fixture });

  assert.equal(manifest.sources.length, 1);
  assert.equal(manifest.sources[0]?.duration, 12);
  assert.equal(manifest.sources[0]?.fps, 29.97);
});

test('createEdl uses transcript word boundaries when available', async () => {
  const root = await makeWorkspace();
  await writeFile(path.join(root, 'take01.mp4'), '');
  await initWorkspace(root);
  await inspectWorkspace(root, { probeJson: path.resolve('fixtures/probe-fixture.json') });
  await writeFile(
    path.join(root, '.cutpilot', 'transcripts', 'take01.json'),
    await readFixture('fixtures/transcript-take01.json')
  );

  const edl = await createEdl(root, 'short-15', 'Test short');
  assert.equal(edl.segments[0]?.start, 0.4);
  assert.equal(edl.segments[0]?.end, 3.3);
  assert.equal(edl.diagnostics?.some((item) => item.level === 'error'), false);
});

test('validateEdl reports out of bounds segment errors', () => {
  const manifest: WorkspaceManifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    sources: [{ path: 'take01.mp4', duration: 3 }]
  };
  const edl: Edl = {
    version: 1,
    title: 'Bad',
    preset: 'short-15',
    aspect: '9:16',
    segments: [{ id: 's01', source: 'take01.mp4', start: 0, end: 9 }]
  };

  const diagnostics = validateEdl(edl, manifest);
  assert.equal(diagnostics.some((item) => item.code === 'segment.out_of_bounds'), true);
});

test('buildRenderPlan emits extract commands and concat copy command', async () => {
  const root = await makeWorkspace();
  const edl: Edl = {
    version: 1,
    title: 'Plan',
    preset: 'short-15',
    aspect: '9:16',
    segments: [{ id: 's01', source: 'take01.mp4', start: 0, end: 2 }]
  };
  const plan = await buildRenderPlan(root, edl);

  assert.equal(plan.expectedDuration, 2);
  assert.equal(plan.commands.length, 2);
  assert.deepEqual(plan.commands.at(-1)?.slice(0, 4), ['ffmpeg', '-y', '-f', 'concat']);
});

test('packTranscripts groups phrases across silence gaps', () => {
  const packed = packTranscripts([{
    source: 'take01.mp4',
    words: [
      { start: 0, end: 0.2, text: 'One' },
      { start: 0.25, end: 0.5, text: 'beat' },
      { start: 1.2, end: 1.5, text: 'Two' }
    ]
  }]);

  assert.match(packed, /\[000.00-000.50\] One beat/);
  assert.match(packed, /\[001.20-001.50\] Two/);
});

async function makeWorkspace(): Promise<string> {
  return await mkdtemp(path.join(tmpdir(), 'cutpilot-'));
}

async function readFixture(file: string): Promise<string> {
  return await readJson<unknown>(path.resolve(file)).then((value) => `${JSON.stringify(value, null, 2)}\n`);
}
