import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { parseSectionConfig, type SectionConfig } from './types';

import { config as myDay } from './my-day/config';
import { config as langue } from './langue/config';
import { config as kitchen } from './kitchen/config';
import { config as stoic } from './stoic/config';
import { config as culture } from './culture/config';
import { config as mindGym } from './mind-gym/config';
import { config as insights } from './insights/config';

/** Built-in Sections, in display order. To add a built-in Section: create its folder, then add it here. */
export const BUILTIN_SECTIONS: SectionConfig[] = [myDay, langue, kitchen, stoic, culture, mindGym, insights];

/** Screens for built-in Sections (code-split). User Sections use the generic screen. */
const BUILTIN_SCREENS: Record<string, LazyExoticComponent<ComponentType<{ section: SectionConfig }>>> = {
  'my-day': lazy(() => import('./my-day')),
  langue: lazy(() => import('./langue')),
  kitchen: lazy(() => import('./kitchen')),
  stoic: lazy(() => import('./stoic')),
  culture: lazy(() => import('./culture')),
  'mind-gym': lazy(() => import('./mind-gym')),
  insights: lazy(() => import('./insights')),
};

export function screenFor(id: string) {
  return BUILTIN_SCREENS[id];
}

const builtinIds = new Set(BUILTIN_SECTIONS.map((s) => s.id));

export async function loadUserSections(): Promise<SectionConfig[]> {
  const rows = await db.customSections.orderBy('id').toArray();
  return rows
    .map((r) => parseSectionConfig(r.config))
    .filter((s): s is SectionConfig => s !== null && !builtinIds.has(s.id));
}

/** All Sections: built-ins first, then the ones you've added. Live-updates when you add one. */
export function useSections(): SectionConfig[] {
  const user = useLiveQuery(loadUserSections, [], []);
  return [...BUILTIN_SECTIONS, ...user];
}

export function useSection(id: string | undefined): SectionConfig | undefined {
  return useSections().find((s) => s.id === id);
}
