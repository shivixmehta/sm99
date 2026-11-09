import type { SectionConfig } from '../types';
import persona from '../../ai/prompts/kitchen.md?raw';

export const config: SectionConfig = {
  id: 'kitchen',
  name: 'Kitchen & Drinks',
  icon: '🍲',
  colour: '#d9774b',
  description: 'Mauritian and French dishes and easy, fun drinks, tailored to your cupboard and your time.',
  persona,
  activities: [
    { id: 'what-to-cook', name: 'What can I make?', description: 'From what you have and the time you’ve got.' },
    { id: 'drinks', name: 'Drinks', description: 'Easy and fun; alcoholic ones clearly labelled.' },
    { id: 'surprise', name: 'Surprise me', description: 'Something you wouldn’t have picked.' },
    { id: 'favourites', name: 'Favourites & ratings', description: 'So the companion learns your taste.' },
  ],
  dailyActivity: { id: 'idea', name: 'Today’s idea', description: 'A dish or drink that suits the day.' },
  contentPack: 'recipes',
  source: 'builtin',
};
