import type { SectionConfig } from '../types';
import persona from '../../ai/prompts/langue.md?raw';

export const config: SectionConfig = {
  id: 'langue',
  name: 'Langue',
  icon: '🇫🇷',
  colour: '#3d6fb6',
  description: 'French at your level: a daily lesson, flashcards that adapt, and real conversation.',
  persona,
  activities: [
    { id: 'lesson', name: 'Leçon du jour', description: 'A short lesson pitched at your level.' },
    { id: 'flashcards', name: 'Flashcards', description: 'Spaced repetition (SM-2).' },
    { id: 'conversation', name: 'Conversation', description: 'Chat in French with gentle corrections.' },
  ],
  dailyActivity: { id: 'phrase', name: 'Phrase du jour', description: 'One useful phrase, with its story.' },
  contentPack: 'french-core',
  source: 'builtin',
};
