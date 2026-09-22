import type { Rank } from '../core/types';
import type { AvatarStyle } from './model';

export type EvolutionVisual = {
  stage: number;
  name: string;
  aura: string;
  auraSoft: string;
  frame: string;
  glow: number;
  pulseMs: number;
};

const rankStage: Record<Rank, number> = {
  E: 0, D: 0, C: 1, B: 1, A: 2, S: 2, SS: 3, SSS: 3, ASCENDED: 4,
};

const palettes: Record<AvatarStyle, Array<[string,string,string]>> = {
  DARK: [
    ['#5CC7FF','#102B3A','#2A607A'], ['#6E7BFF','#171D48','#4B54A5'], ['#9C63FF','#24134A','#7444C4'],
    ['#D65CFF','#381348','#9D43B8'], ['#FFB84D','#3A2210','#B87722'],
  ],
  CYBER: [
    ['#5CEBFF','#0A3038','#2B7180'], ['#00E5FF','#053941','#1C8695'], ['#55FFF3','#0A4039','#2AA89A'],
    ['#9B7CFF','#201A4D','#735CC4'], ['#FFFFFF','#25424B','#BCEEFF'],
  ],
  WARLORD: [
    ['#FF735C','#3A1711','#8A3A2B'], ['#FF8A5C','#462014','#A95132'], ['#FFC05C','#4A3511','#B88425'],
    ['#FFE28A','#4A3C15','#C0A043'], ['#FFFFFF','#4A4330','#E6D79A'],
  ],
};

export function getEvolutionVisual(level: number, rank: Rank, style: AvatarStyle = 'CYBER'): EvolutionVisual {
  const stage = Math.max(0, Math.min(4, Math.max(rankStage[rank] ?? 0, Math.floor(Math.max(1, level) / 10))));
  const [aura, auraSoft, frame] = palettes[style][stage];
  return {
    stage,
    name: ['ORIGIN','AWAKENED','HUNTER','DOMINATOR','ASCENDED'][stage],
    aura,
    auraSoft,
    frame,
    glow: 10 + stage * 7,
    pulseMs: Math.max(850, 1650 - stage * 150),
  };
}
