import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PRESETS } from './presets.js';
import { readJson, workspacePath, writeJson } from './fs.js';
import { isVideoPath, parseFfprobeJson, probeWithFfprobe } from './probe.js';
import type { ProbeMetadata, WorkspaceManifest } from './types.js';

export async function initWorkspace(root: string): Promise<void> {
  const dirs = ['edl', 'renders', 'artifacts', 'transcripts', 'tmp', 'presets'];
  await Promise.all(dirs.map((dir) => writeJson(workspacePath(root, dir, '.keep.json'), { keep: true })));
  await writeFile(workspacePath(root, 'project.md'), '# Cutpilot Project\n\nLocal edit notes go here.\n', 'utf8');
  for (const preset of Object.values(PRESETS)) {
    await writeJson(workspacePath(root, 'presets', `${preset.name}.json`), preset);
  }
}

export async function inspectWorkspace(root: string, options: { probeJson?: string } = {}): Promise<WorkspaceManifest> {
  const files = (await readdir(root)).filter(isVideoPath).sort();
  const mock = options.probeJson ? await readJson<Record<string, unknown>>(options.probeJson) : undefined;
  const sources: ProbeMetadata[] = files.map((file) => {
    const absolute = path.join(root, file);
    if (mock?.[file]) {
      return parseFfprobeJson(file, mock[file]);
    }
    return { ...probeWithFfprobe(absolute), path: file };
  });

  const manifest: WorkspaceManifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    sources
  };
  await writeJson(workspacePath(root, 'manifest.json'), manifest);
  return manifest;
}
