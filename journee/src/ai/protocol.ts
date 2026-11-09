/**
 * The wire format between the app and /api/ai.
 * Request: JSON body. Response: newline-delimited JSON (one event per line), streamed.
 */
import type { AITask } from './models';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  task: AITask;
  system: string;
  messages: AIMessage[];
}

export type AIEvent =
  | { t: 'text'; v: string }
  | { t: 'done'; stop: string | null; model: string }
  | { t: 'error'; code: string; message: string };
