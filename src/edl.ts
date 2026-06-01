import path from 'node:path';
import { PRESETS } from './presets.js';
import { readJson, workspacePath, writeJson } from './fs.js';
import type { Diagnostic, Edl, EdlSegment, PresetName, Transcript, TranscriptWord, WorkspaceManifest } from './types.js';

export async function createEdl(root: string, presetName: PresetName, title = 'Untitled edit'): Promise<Edl> {
  const manifest = await readJson<WorkspaceManifest>(workspacePath(root, 'manifest.json'));
  const preset = PRESETS[presetName];
  const segments: EdlSegment[] = [];
  let remaining = preset.targetSeconds;

  for (const source of manifest.sources) {
    if (segments.length >= preset.maxSegments || remaining <= 0) break;
    const transcript = await loadTranscript(root, source.path);
    const candidate = transcript
      ? selectTranscriptWindow(transcript.words, Math.min(remaining, 4))
      : { start: 0, end: Math.min(source.duration, Math.min(remaining, 4)), text: undefined };
    if (candidate.end <= candidate.start) continue;
    segments.push({
      id: `s${String(segments.length + 1).padStart(2, '0')}`,
      source: source.path,
      start: round(candidate.start),
      end: round(candidate.end),
      role: segments.length === 0 ? 'hook' : 'beat',
      text: candidate.text,
      reason: transcript ? 'Selected from transcript word boundaries.' : 'Selected from source duration; add transcript JSON for word-aware cuts.'
    });
    remaining -= candidate.end - candidate.start;
  }

  const edl: Edl = {
    version: 1,
    title,
    preset: presetName,
    aspect: preset.aspect,
    targetSeconds: preset.targetSeconds,
    segments,
    overlays: presetName === 'carousel'
      ? segments.map((segment, index) => ({
        id: `card${index + 1}`,
        start: outputOffset(segments, index),
        end: outputOffset(segments, index) + Math.min(2.5, segment.end - segment.start),
        type: 'title',
        text: segment.role ?? `Beat ${index + 1}`
      }))
      : []
  };
  edl.diagnostics = validateEdl(edl, manifest, await loadTranscripts(root));
  await writeJson(workspacePath(root, 'edl', `${presetName}.json`), edl);
  return edl;
}

export function validateEdl(edl: Edl, manifest: WorkspaceManifest, transcripts: Transcript[] = []): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const sources = new Map(manifest.sources.map((source) => [source.path, source]));
  const transcriptMap = new Map(transcripts.map((transcript) => [transcript.source, transcript]));

  if (edl.version !== 1) {
    diagnostics.push({ level: 'error', code: 'edl.version', message: 'Only EDL version 1 is supported.' });
  }
  if (edl.segments.length === 0) {
    diagnostics.push({ level: 'error', code: 'edl.empty', message: 'EDL must contain at least one segment.' });
  }

  for (const segment of edl.segments) {
    const source = sources.get(segment.source);
    if (!source) {
      diagnostics.push({ level: 'error', code: 'segment.source_missing', message: `Unknown source ${segment.source}.`, segmentId: segment.id });
      continue;
    }
    if (segment.start < 0 || segment.end <= segment.start) {
      diagnostics.push({ level: 'error', code: 'segment.range', message: 'Segment times must be positive and end after start.', segmentId: segment.id });
    }
    if (segment.end > source.duration + 0.001) {
      diagnostics.push({ level: 'error', code: 'segment.out_of_bounds', message: `Segment exceeds source duration ${source.duration}s.`, segmentId: segment.id });
    }
    const transcript = transcriptMap.get(segment.source);
    if (transcript && !edgesMatchWords(segment, transcript.words)) {
      diagnostics.push({ level: 'warning', code: 'segment.word_boundary', message: 'Segment edge is not aligned to a transcript word boundary.', segmentId: segment.id });
    }
  }

  const duration = totalDuration(edl);
  if (edl.targetSeconds && duration > edl.targetSeconds * 1.15) {
    diagnostics.push({ level: 'warning', code: 'timeline.over_target', message: `Timeline is ${round(duration)}s, above target ${edl.targetSeconds}s.` });
  }
  diagnostics.push({ level: 'info', code: 'timeline.duration', message: `Expected output duration: ${round(duration)}s.` });
  return diagnostics;
}

export function totalDuration(edl: Edl): number {
  return edl.segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0);
}

export async function loadTranscripts(root: string): Promise<Transcript[]> {
  const manifestPath = workspacePath(root, 'manifest.json');
  const manifest = await readJson<WorkspaceManifest>(manifestPath);
  const loaded: Transcript[] = [];
  for (const source of manifest.sources) {
    const transcript = await loadTranscript(root, source.path);
    if (transcript) loaded.push(transcript);
  }
  return loaded;
}

async function loadTranscript(root: string, source: string): Promise<Transcript | undefined> {
  const name = `${path.parse(source).name}.json`;
  try {
    const data = await readJson<Transcript | { words?: TranscriptWord[] }>(workspacePath(root, 'transcripts', name));
    return {
      source,
      words: Array.isArray(data.words) ? data.words : []
    };
  } catch {
    return undefined;
  }
}

function selectTranscriptWindow(words: TranscriptWord[], targetSeconds: number): { start: number; end: number; text?: string } {
  if (words.length === 0) return { start: 0, end: 0 };
  const start = words[0].start;
  const selected: TranscriptWord[] = [];
  for (const word of words) {
    if (word.end - start > targetSeconds && selected.length > 0) break;
    selected.push(word);
  }
  const last = selected.at(-1) ?? words[0];
  return {
    start,
    end: last.end,
    text: selected.map((word) => word.text).join(' ')
  };
}

function edgesMatchWords(segment: EdlSegment, words: TranscriptWord[]): boolean {
  const starts = words.some((word) => close(word.start, segment.start));
  const ends = words.some((word) => close(word.end, segment.end));
  return starts && ends;
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.035;
}

function outputOffset(segments: EdlSegment[], index: number): number {
  return segments.slice(0, index).reduce((sum, segment) => sum + segment.end - segment.start, 0);
}

function round(value: number): number {
  return Number(value.toFixed(3));
}
