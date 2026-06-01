export type PresetName = 'short-15' | 'carousel' | 'talking-head-cleanup';

export type ProbeMetadata = {
  path: string;
  duration: number;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio?: boolean;
};

export type TranscriptWord = {
  start: number;
  end: number;
  text: string;
  speaker?: string;
};

export type Transcript = {
  source: string;
  words: TranscriptWord[];
};

export type EdlSegment = {
  id: string;
  source: string;
  start: number;
  end: number;
  role?: string;
  text?: string;
  reason?: string;
};

export type EdlOverlay = {
  id: string;
  start: number;
  end: number;
  type: 'caption' | 'title' | 'image' | 'video';
  text?: string;
  file?: string;
};

export type Edl = {
  version: 1;
  title: string;
  preset: PresetName;
  aspect: '9:16' | '1:1' | '16:9';
  targetSeconds?: number;
  segments: EdlSegment[];
  overlays?: EdlOverlay[];
  diagnostics?: Diagnostic[];
};

export type DiagnosticLevel = 'info' | 'warning' | 'error';

export type Diagnostic = {
  level: DiagnosticLevel;
  code: string;
  message: string;
  segmentId?: string;
};

export type WorkspaceManifest = {
  version: 1;
  createdAt: string;
  sources: ProbeMetadata[];
};

export type RenderPlan = {
  output: string;
  expectedDuration: number;
  commands: string[][];
  concatList: string;
  notes: string[];
};
