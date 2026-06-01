import type { PresetName } from './types.js';

export type Preset = {
  name: PresetName;
  aspect: '9:16' | '1:1' | '16:9';
  targetSeconds: number;
  maxSegments: number;
  description: string;
};

export const PRESETS: Record<PresetName, Preset> = {
  'short-15': {
    name: 'short-15',
    aspect: '9:16',
    targetSeconds: 15,
    maxSegments: 6,
    description: 'A tight vertical short with a hook, proof beat, and exit line.'
  },
  carousel: {
    name: 'carousel',
    aspect: '1:1',
    targetSeconds: 30,
    maxSegments: 8,
    description: 'A square or social carousel-style sequence with clear beat cards.'
  },
  'talking-head-cleanup': {
    name: 'talking-head-cleanup',
    aspect: '16:9',
    targetSeconds: 120,
    maxSegments: 24,
    description: 'A cleaned talking-head edit that trims dead space and filler.'
  }
};

export function isPresetName(value: string): value is PresetName {
  return value in PRESETS;
}
