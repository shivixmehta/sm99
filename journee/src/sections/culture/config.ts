import type { SectionConfig } from '../types';
import persona from '../../ai/prompts/culture.md?raw';

export const config: SectionConfig = {
  id: 'culture',
  name: 'Culture',
  icon: '🎨',
  colour: '#9b5a8c',
  description: 'A daily card of art, history or culture: the story, why it matters, and a short quiz.',
  persona,
  activities: [
    { id: 'card', name: 'Today’s card', description: 'Story, why it matters, connections.' },
    { id: 'quiz', name: 'Quiz', description: 'Three questions.' },
    { id: 'library', name: 'Library', description: 'Your saved cards.' },
  ],
  dailyActivity: { id: 'card', name: 'Culture card', description: 'One story for today.' },
  source: 'builtin',
};
