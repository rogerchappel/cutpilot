import { spawnSync } from 'node:child_process';
import path from 'node:path';
import type { ProbeMetadata } from './types.js';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.mkv', '.webm']);

export function isVideoPath(file: string): boolean {
  return VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase());
}

export function parseFfprobeJson(file: string, raw: unknown): ProbeMetadata {
  const data = raw as {
    format?: { duration?: string };
    streams?: Array<{
      codec_type?: string;
      width?: number;
      height?: number;
      avg_frame_rate?: string;
      r_frame_rate?: string;
    }>;
  };
  const video = data.streams?.find((stream) => stream.codec_type === 'video');
  const audio = data.streams?.some((stream) => stream.codec_type === 'audio') ?? false;
  const rate = video?.avg_frame_rate ?? video?.r_frame_rate;

  return {
    path: file,
    duration: Number(data.format?.duration ?? 0),
    width: video?.width,
    height: video?.height,
    fps: rate ? parseFrameRate(rate) : undefined,
    hasAudio: audio
  };
}

export function parseFrameRate(value: string): number | undefined {
  const [num, den] = value.split('/').map(Number);
  if (!Number.isFinite(num)) return undefined;
  if (!den) return num;
  if (den === 0) return undefined;
  return Number((num / den).toFixed(3));
}

export function probeWithFfprobe(file: string): ProbeMetadata {
  const result = spawnSync('ffprobe', [
    '-v',
    'quiet',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    file
  ], { encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`ffprobe failed for ${file}: ${result.stderr || result.error?.message || 'unknown error'}`);
  }

  return parseFfprobeJson(file, JSON.parse(result.stdout));
}
