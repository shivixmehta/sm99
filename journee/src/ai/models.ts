/**
 * The ONE place model names live. Shared by the app and the serverless function.
 *
 * The app only ever says which *task* it wants; the function picks the model,
 * so nobody holding the passcode can ask for an arbitrary (expensive) model.
 *
 * Current models (checked November 2026, $ per million tokens, input/output):
 *   claude-opus-5-5    $4 / $20     strongest everyday model
 *   claude-sonnet-5-5  $2 / $10     a cheaper middle option
 *   claude-haiku-5-5   $0.10 / $0.50  fast and very cheap
 */

export type AITask = 'chat' | 'brief' | 'small';

export interface TaskModel {
  model: string;
  /** How hard the model thinks before answering: low | medium | high. Lower = faster and cheaper. */
  effort: 'low' | 'medium' | 'high';
  /** Hard cap on the length of one reply. */
  maxTokens: number;
  /** Opt into Anthropic's server-side fallback if a safety filter wrongly declines (Opus/Sonnet only). */
  fallback: boolean;
}

export const TASK_MODELS: Record<AITask, TaskModel> = {
  // Conversations in every Section (tutor, coach, cook…)
  chat: { model: 'claude-opus-5-5', effort: 'low', maxTokens: 4000, fallback: true },
  // The daily brief and weekly insights: a bit more thought
  brief: { model: 'claude-opus-5-5', effort: 'medium', maxTokens: 6000, fallback: true },
  // Memory extraction, titles, small JSON jobs
  small: { model: 'claude-haiku-5-5', effort: 'low', maxTokens: 2000, fallback: false },
};

/** Request limits enforced by the function (protects your credits from bugs and abuse). */
export const LIMITS = {
  maxMessages: 60,
  maxTotalChars: 80_000,
  maxSystemChars: 30_000,
};

export function isTask(v: unknown): v is AITask {
  return v === 'chat' || v === 'brief' || v === 'small';
}
