import shared from './prompts/_shared.md?raw';
import type { SectionConfig } from '../sections/types';
import { longDate, localHour } from '../lib/time';

/**
 * Builds a Section's system prompt: shared voice + Section persona + a little live context.
 * Stable text comes first; things that change (the date) come last, so a future
 * prompt cache can reuse the stable prefix.
 * Phase 4 adds the profile, relevant memories and recent activity here.
 */
export function buildSystemPrompt(section: SectionConfig, extraContext: string[] = []): string {
  const now = new Date();
  const context = [
    `Today is ${longDate(now)}, about ${localHour(now)}:00 in Mauritius.`,
    ...extraContext,
  ];
  return [shared.trim(), section.persona.trim(), '# Context\n' + context.map((c) => `- ${c}`).join('\n')].join('\n\n');
}
