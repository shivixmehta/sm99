import type { SectionConfig } from '../types';
import persona from '../../ai/prompts/stoic.md?raw';

export const config: SectionConfig = {
  id: 'stoic',
  name: 'Stoic & Growth',
  icon: '🏛️',
  colour: '#8a7a63',
  description: 'A daily Stoic passage in plain words, intentions, reflection and a Socratic coach.',
  persona,
  activities: [
    { id: 'passage', name: 'Daily passage', description: 'Marcus, Seneca or Epictetus, explained.' },
    { id: 'intention', name: 'Morning intention', description: 'One line to steer the day.' },
    { id: 'reflection', name: 'Evening reflection', description: 'A short journal.' },
    { id: 'control', name: 'Dichotomy of control', description: 'Sort a worry: mine or not mine?' },
    { id: 'coach', name: 'Socratic coach', description: 'Questions, not lectures.' },
  ],
  dailyActivity: { id: 'thought', name: 'Stoic thought', description: 'One idea for today.' },
  contentPack: 'stoic-passages',
  source: 'builtin',
};
