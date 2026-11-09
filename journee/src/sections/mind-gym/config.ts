import type { SectionConfig } from '../types';
import persona from '../../ai/prompts/mind-gym.md?raw';

export const config: SectionConfig = {
  id: 'mind-gym',
  name: 'Mind Gym',
  icon: '🧩',
  colour: '#c99a2e',
  description: 'A five-minute workout for fun and focus: maths, memory, logic, estimation and French word games.',
  persona,
  activities: [
    { id: 'workout', name: 'Daily workout', description: 'Five minutes, five games.' },
    { id: 'scores', name: 'Scores', description: 'Your progress over time.' },
  ],
  dailyActivity: { id: 'challenge', name: 'Today’s challenge', description: 'One quick puzzle.' },
  contentPack: 'puzzles',
  source: 'builtin',
};
