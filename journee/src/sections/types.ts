/**
 * A Section is one area of the app, described entirely by data.
 * Built-in Sections live in src/sections/<id>/config.ts; user-made ones
 * (from "Add a Section") are stored in Dexie and use the same shape.
 */
export interface SectionActivity {
  id: string;
  name: string;
  description: string;
}

export interface SectionConfig {
  id: string; // url-safe slug, e.g. 'langue'
  name: string;
  icon: string; // an emoji
  colour: string; // hex accent colour
  description: string;
  /** The AI persona / system prompt for this Section (Markdown). */
  persona: string;
  activities: SectionActivity[];
  /** The one small thing this Section offers each day (feeds the Today brief). */
  dailyActivity: SectionActivity;
  /** Id of an offline content pack in src/content/, if any. */
  contentPack?: string;
  source: 'builtin' | 'user';
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Validates an untrusted object (e.g. from Dexie or an import) as a SectionConfig. */
export function parseSectionConfig(raw: unknown): SectionConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const act = (v: unknown): v is SectionActivity =>
    !!v && typeof v === 'object' && str((v as SectionActivity).id) && str((v as SectionActivity).name);
  if (!str(r.id) || !SLUG.test(r.id as string)) return null;
  if (!str(r.name) || !str(r.icon) || !str(r.persona)) return null;
  if (!Array.isArray(r.activities) || !r.activities.every(act)) return null;
  if (!act(r.dailyActivity)) return null;
  return {
    id: r.id as string,
    name: r.name as string,
    icon: r.icon as string,
    colour: typeof r.colour === 'string' && /^#[0-9a-fA-F]{6}$/.test(r.colour) ? r.colour : '#1f7a8c',
    description: typeof r.description === 'string' ? r.description : '',
    persona: r.persona as string,
    activities: r.activities as SectionActivity[],
    dailyActivity: r.dailyActivity as SectionActivity,
    contentPack: typeof r.contentPack === 'string' ? r.contentPack : undefined,
    source: 'user',
  };
}
