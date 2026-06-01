import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { workspacePath } from './fs.js';
import type { Edl, Transcript } from './types.js';

export async function writeAgentArtifacts(root: string, edl: Edl, transcripts: Transcript[]): Promise<string[]> {
  const files: string[] = [];
  const packed = workspacePath(root, 'artifacts', 'takes_packed.md');
  const diagnostics = workspacePath(root, 'artifacts', 'timeline_diagnostics.md');
  const brief = workspacePath(root, 'artifacts', 'agent_brief.md');

  await writeFile(packed, packTranscripts(transcripts), 'utf8');
  await writeFile(diagnostics, renderDiagnostics(edl), 'utf8');
  await writeFile(brief, renderBrief(edl), 'utf8');
  files.push(packed, diagnostics, brief);
  return files;
}

export function packTranscripts(transcripts: Transcript[]): string {
  if (transcripts.length === 0) return '# Packed Takes\n\nNo transcripts found. Add `.cutpilot/transcripts/<source>.json` for word-aware cuts.\n';
  const lines = ['# Packed Takes', ''];
  for (const transcript of transcripts) {
    lines.push(`## ${path.parse(transcript.source).name}`);
    let phrase: string[] = [];
    let start = transcript.words[0]?.start ?? 0;
    let previousEnd = start;
    for (const word of transcript.words) {
      if (phrase.length > 0 && word.start - previousEnd >= 0.5) {
        lines.push(`  [${fmt(start)}-${fmt(previousEnd)}] ${phrase.join(' ')}`);
        phrase = [];
        start = word.start;
      }
      phrase.push(word.text);
      previousEnd = word.end;
    }
    if (phrase.length > 0) lines.push(`  [${fmt(start)}-${fmt(previousEnd)}] ${phrase.join(' ')}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function renderDiagnostics(edl: Edl): string {
  const rows = edl.diagnostics ?? [];
  return `# Timeline Diagnostics\n\n${rows.map((item) => `- ${item.level.toUpperCase()} ${item.code}${item.segmentId ? ` (${item.segmentId})` : ''}: ${item.message}`).join('\n')}\n`;
}

function renderBrief(edl: Edl): string {
  return `# Agent Edit Brief\n\nPreset: ${edl.preset}\nAspect: ${edl.aspect}\nTarget: ${edl.targetSeconds ?? 'open'}s\n\nUse the EDL as the source of truth. Keep cuts on transcript word boundaries when transcripts exist, run \`cutpilot edl validate\` before render, and dry-run render planning before writing final media.\n`;
}

function fmt(value: number): string {
  return value.toFixed(2).padStart(6, '0');
}
