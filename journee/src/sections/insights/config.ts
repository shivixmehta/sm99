import type { SectionConfig } from '../types';
import persona from '../../ai/prompts/insights.md?raw';

export const config: SectionConfig = {
  id: 'insights',
  name: 'Insights',
  icon: '📈',
  colour: '#4f8fa8',
  description: 'A weekly look at your habits, mood, learning and reflections, drawn only from your own data.',
  persona,
  activities: [
    { id: 'weekly', name: 'Weekly review', description: 'Patterns from the last seven days.' },
  ],
  dailyActivity: { id: 'glance', name: 'This week so far', description: 'A quick glance.' },
  source: 'builtin',
};
