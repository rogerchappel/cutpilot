import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { totalDuration } from './edl.js';
import { workspacePath } from './fs.js';
import type { Edl, RenderPlan } from './types.js';

export async function buildRenderPlan(root: string, edl: Edl, output = workspacePath(root, 'renders', 'final.mp4')): Promise<RenderPlan> {
  const tmpDir = workspacePath(root, 'tmp', 'render');
  await mkdir(tmpDir, { recursive: true });
  const commands: string[][] = [];
  const concatLines: string[] = [];

  edl.segments.forEach((segment, index) => {
    const clip = path.join(tmpDir, `${String(index + 1).padStart(3, '0')}-${segment.id}.mp4`);
    const duration = segment.end - segment.start;
    commands.push([
      'ffmpeg',
      '-y',
      '-ss',
      String(segment.start),
      '-t',
      String(duration),
      '-i',
      path.join(root, segment.source),
      '-vf',
      scaleFilter(edl.aspect),
      '-af',
      `afade=t=in:st=0:d=0.03,afade=t=out:st=${Math.max(0, duration - 0.03).toFixed(3)}:d=0.03`,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '18',
      '-c:a',
      'aac',
      clip
    ]);
    concatLines.push(`file '${clip.replaceAll("'", "'\\''")}'`);
  });

  const concatList = path.join(tmpDir, 'concat.txt');
  await writeFile(concatList, `${concatLines.join('\n')}\n`, 'utf8');
  commands.push(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', output]);

  return {
    output,
    expectedDuration: Number(totalDuration(edl).toFixed(3)),
    commands,
    concatList,
    notes: [
      'Segments are extracted individually with 30ms audio fades.',
      'The final command uses concat demuxer copy to avoid another encode pass.',
      'Title/card overlays are represented in the EDL for agents; this release plans them but does not burn complex overlays yet.'
    ]
  };
}

export function executeRenderPlan(plan: RenderPlan): void {
  for (const command of plan.commands) {
    const [bin, ...args] = command;
    const result = spawnSync(bin, args, { stdio: 'inherit' });
    if (result.status !== 0) {
      throw new Error(`${bin} failed with exit code ${result.status ?? 'unknown'}`);
    }
  }
}

function scaleFilter(aspect: Edl['aspect']): string {
  if (aspect === '9:16') return 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
  if (aspect === '1:1') return 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080';
  return 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
}
