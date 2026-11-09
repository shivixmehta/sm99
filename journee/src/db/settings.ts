import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './schema';

export type ThemePref = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemePref;
  memoryPaused: boolean;
  passcode: string; // stored on-device only; sent to our own function in Phase 2
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  memoryPaused: false,
  passcode: '',
};

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const row = await db.settings.get(key);
  return (row?.value as AppSettings[K]) ?? DEFAULT_SETTINGS[key];
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  await db.settings.put({ key, value });
}

export function useSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return useLiveQuery(() => getSetting(key), [key], DEFAULT_SETTINGS[key]);
}
