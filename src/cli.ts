#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeAgentArtifacts } from './artifacts.js';
import { createEdl, loadTranscripts, validateEdl } from './edl.js';
import { readJson, workspacePath, writeJson } from './fs.js';
import { isPresetName, PRESETS } from './presets.js';
import { buildRenderPlan, executeRenderPlan } from './render.js';
import type { Edl, WorkspaceManifest } from './types.js';
import { initWorkspace, inspectWorkspace } from './workspace.js';

const args = process.argv.slice(2);

async function main(): Promise<void> {
  const [group, action, ...rest] = args;
  if (!group || group === '--help' || group === '-h') return help();
  if (group === '--version' || group === '-v') return version();

  if (group === 'init') {
    const tail = args.slice(1);
    const root = option(tail, '--root') ?? process.cwd();
    await initWorkspace(root);
    console.log(JSON.stringify({ ok: true, workspace: path.join(root, '.cutpilot') }, null, 2));
    return;
  }

  if (group === 'inspect') {
    const tail = args.slice(1);
    const root = option(tail, '--root') ?? process.cwd();
    const manifest = await inspectWorkspace(root, { probeJson: option(tail, '--probe-json') });
    console.log(JSON.stringify({ ok: true, manifest }, null, 2));
    return;
  }

  if (group === 'presets') {
    console.log(JSON.stringify({ ok: true, presets: Object.values(PRESETS) }, null, 2));
    return;
  }

  if (group === 'edl' && action === 'create') {
    const root = option(rest, '--root') ?? process.cwd();
    const preset = option(rest, '--preset') ?? 'short-15';
    if (!isPresetName(preset)) throw new Error(`Unknown preset ${preset}. Run cutpilot presets.`);
    const edl = await createEdl(root, preset, option(rest, '--title') ?? 'Untitled edit');
    console.log(JSON.stringify({ ok: true, edl, path: workspacePath(root, 'edl', `${preset}.json`) }, null, 2));
    return;
  }

  if (group === 'edl' && action === 'validate') {
    const root = option(rest, '--root') ?? process.cwd();
    const file = option(rest, '--file') ?? workspacePath(root, 'edl', 'short-15.json');
    const manifest = await readJson<WorkspaceManifest>(workspacePath(root, 'manifest.json'));
    const edl = await readJson<Edl>(file);
    const diagnostics = validateEdl(edl, manifest, await loadTranscripts(root));
    edl.diagnostics = diagnostics;
    await writeJson(file, edl);
    const ok = diagnostics.every((item) => item.level !== 'error');
    console.log(JSON.stringify({ ok, diagnostics }, null, 2));
    if (!ok) process.exitCode = 1;
    return;
  }

  if (group === 'render') {
    const tail = args.slice(1);
    const root = option(tail, '--root') ?? process.cwd();
    const file = option(tail, '--edl') ?? workspacePath(root, 'edl', 'short-15.json');
    const output = option(tail, '--output') ?? workspacePath(root, 'renders', 'final.mp4');
    const plan = await buildRenderPlan(root, await readJson<Edl>(file), output);
    if (has(tail, '--dry-run')) {
      console.log(JSON.stringify({ ok: true, plan }, null, 2));
      return;
    }
    executeRenderPlan(plan);
    console.log(JSON.stringify({ ok: true, output, expectedDuration: plan.expectedDuration }, null, 2));
    return;
  }

  if (group === 'artifacts') {
    const tail = args.slice(1);
    const root = option(tail, '--root') ?? process.cwd();
    const file = option(tail, '--edl') ?? workspacePath(root, 'edl', 'short-15.json');
    const edl = await readJson<Edl>(file);
    const files = await writeAgentArtifacts(root, edl, await loadTranscripts(root));
    console.log(JSON.stringify({ ok: true, files }, null, 2));
    return;
  }

  if (group === 'schema') {
    const schema = await readPackageFile('docs/EDL.md');
    console.log(schema);
    return;
  }

  throw new Error(`Unknown command: ${args.join(' ')}`);
}

function help(): void {
  console.log(`cutpilot 0.1.0

Local-first agentic video editing helper.

Commands:
  cutpilot init [--root DIR]
  cutpilot inspect [--root DIR] [--probe-json FILE]
  cutpilot presets
  cutpilot edl create [--root DIR] [--preset short-15|carousel|talking-head-cleanup] [--title TEXT]
  cutpilot edl validate [--root DIR] [--file FILE]
  cutpilot render [--root DIR] [--edl FILE] [--output FILE] [--dry-run]
  cutpilot artifacts [--root DIR] [--edl FILE]
  cutpilot schema
`);
}

async function version(): Promise<void> {
  const pkg = JSON.parse(await readPackageFile('package.json')) as { version: string };
  console.log(pkg.version);
}

async function readPackageFile(relative: string): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), relative),
    path.resolve(here, '..', relative),
    path.resolve(here, '..', '..', relative)
  ];
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf8');
    } catch {
      // Try the next likely source/build package root.
    }
  }
  throw new Error(`Could not find ${relative}`);
}

function option(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] : undefined;
}

function has(values: string[], name: string): boolean {
  return values.includes(name);
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
