import Dexie, { type EntityTable } from 'dexie';
import { seedProfile } from './seed';

/**
 * Journée's on-device database (IndexedDB via Dexie).
 *
 * Conventions:
 * - `createdAt` / `updatedAt` are epoch milliseconds (JSON-safe for backups).
 * - `day` is a Mauritius-local YYYY-MM-DD key from lib/time.ts#dayKey.
 * - Booleans are never indexed (IndexedDB can't index them).
 * - The whole schema is declared up front so later phases add features, not migrations.
 *   If a later phase does need a change, add `this.version(2).stores({...})` below; never edit version 1.
 */

export interface Profile {
  id: 'me';
  name?: string;
  timezone: string;
  location: string;
  frenchLevel: string; // CEFR-ish: A1…C2, plus free notes
  diet: string[];
  tastes: string[];
  interests: string[];
  goals: string[];
  schedule: string;
  notes: string;
  updatedAt: number;
}

export interface Memory {
  id?: number;
  text: string;
  section: string; // section id, or 'global'
  source: string; // e.g. 'chat:langue', 'onboarding', 'manual'
  importance: number; // 1–5
  createdAt: number;
  updatedAt: number;
  day: string;
}

export interface ActivityEntry {
  id?: number;
  section: string;
  type: string; // 'quiz', 'flashcard-review', 'habit-check', 'recipe-rating', 'mind-gym', ...
  day: string;
  createdAt: number;
  payload: Record<string, unknown>;
}

export interface Habit {
  id?: number;
  name: string;
  icon?: string;
  archived: boolean;
  createdAt: number;
}

export interface HabitCheck {
  id?: number;
  habitId: number;
  day: string;
  createdAt: number;
}

export interface JournalEntry {
  id?: number;
  kind: string; // 'morning-intention', 'evening-review', 'stoic-reflection', 'control-exercise', ...
  section: string;
  day: string;
  text: string;
  data?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface Flashcard {
  id?: number;
  deck: string;
  front: string;
  back: string;
  notes?: string;
  // SM-2 state
  ease: number;
  interval: number; // days
  repetitions: number;
  due: string; // day key
  createdAt: number;
}

export interface ChatMessage {
  id?: number;
  section: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface CustomSection {
  id: string;
  config: unknown; // a SectionConfig, validated on load
  createdAt: number;
}

export interface SavedCard {
  id?: number;
  kind: string; // 'culture', 'recipe', 'drink', 'stoic'
  title: string;
  body: unknown;
  rating?: number;
  favourite: boolean;
  savedAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
}

export class JourneeDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>;
  memories!: EntityTable<Memory, 'id'>;
  activityLog!: EntityTable<ActivityEntry, 'id'>;
  habits!: EntityTable<Habit, 'id'>;
  habitChecks!: EntityTable<HabitCheck, 'id'>;
  journal!: EntityTable<JournalEntry, 'id'>;
  flashcards!: EntityTable<Flashcard, 'id'>;
  chats!: EntityTable<ChatMessage, 'id'>;
  customSections!: EntityTable<CustomSection, 'id'>;
  savedCards!: EntityTable<SavedCard, 'id'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor() {
    super('journee');
    this.version(1).stores({
      profile: 'id',
      memories: '++id, section, importance, createdAt, day',
      activityLog: '++id, section, type, day, createdAt, [section+day]',
      habits: '++id, createdAt',
      habitChecks: '++id, habitId, day, &[habitId+day]',
      journal: '++id, kind, section, day, createdAt',
      flashcards: '++id, deck, due, [deck+due], &[deck+front]',
      chats: '++id, section, threadId, createdAt, [section+threadId]',
      customSections: 'id',
      savedCards: '++id, kind, savedAt',
      settings: 'key',
    });

    this.on('populate', (tx) => {
      tx.table('profile').add(seedProfile());
    });
  }
}

export const db = new JourneeDB();

/** Table names in a stable order, used by backup/restore. */
export const TABLE_NAMES = db.tables.map((t) => t.name);
