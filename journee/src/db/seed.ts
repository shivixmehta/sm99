import type { Profile } from './schema';
import { APP_TIMEZONE } from '../config';

/** The starting profile. The app's memory grows from here, and every field is editable. */
export function seedProfile(): Profile {
  return {
    id: 'me',
    timezone: APP_TIMEZONE,
    location: 'Mauritius',
    frenchLevel: 'Learning (level to be assessed)',
    diet: [],
    tastes: ['Food', 'Easy, fun drinks'],
    interests: ['French', 'Food & drinks', 'Art', 'History', 'Culture', 'Stoicism', 'Self-development'],
    goals: ['Plan my days well', 'Build habits', 'Keep my brain sharp', 'Gradually optimise my life'],
    schedule: '',
    notes: 'Enjoys depth: the "why" behind things, surprising connections and real stories, told warmly and calmly.',
    updatedAt: Date.now(),
  };
}
