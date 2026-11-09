import type { SectionConfig } from '../types';
import persona from '../../ai/prompts/my-day.md?raw';

export const config: SectionConfig = {
  id: 'my-day',
  name: 'My Day',
  icon: '🌅',
  colour: '#3a9d8f',
  description: 'Three priorities, a gentle check-in, time blocks, habits and an evening review.',
  persona,
  activities: [
    { id: 'priorities', name: 'Top 3 priorities', description: 'Choose what truly matters today.' },
    { id: 'check-in', name: 'Energy & mood', description: 'A quick check-in to shape the day.' },
    { id: 'time-blocks', name: 'Time blocks', description: 'Give the priorities a place in the day.' },
    { id: 'habits', name: 'Habits', description: 'Streaks and a heatmap, without the guilt.' },
    { id: 'evening-review', name: 'Evening review', description: 'The Stoic look back at the day.' },
  ],
  dailyActivity: { id: 'plan', name: 'Plan today', description: 'Pick your three and check in.' },
  source: 'builtin',
};
