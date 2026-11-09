import { getSetting } from '../db/settings';
import type { AITask } from './models';
import type { AIEvent, AIMessage } from './protocol';

export const AI_ENDPOINT = '/api/ai';

/** A failure explained in plain words, with a code the UI can act on. */
export class AIError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface StreamOptions {
  task: AITask;
  system: string;
  messages: AIMessage[];
  signal?: AbortSignal;
  onText?: (fullTextSoFar: string, delta: string) => void;
}

export interface StreamResult {
  text: string;
  stop: string | null;
  model: string;
  aborted: boolean;
}

const FRIENDLY: Record<string, string> = {
  no_passcode: 'Add your AI passcode in Settings first.',
  bad_passcode: 'That passcode wasn’t accepted. Check it in Settings.',
  offline: 'You’re offline. The AI needs a connection; everything else still works.',
  no_backend: 'The AI service isn’t reachable here. It runs once the app is deployed (or under `netlify dev`).',
  rate_limited: 'Too many requests right now. Try again in a minute.',
};

/** Streams an AI reply. Resolves with the full text; partial text is kept if you abort. */
export async function streamAI(opts: StreamOptions): Promise<StreamResult> {
  const passcode = await getSetting('passcode');
  if (!passcode) throw new AIError('no_passcode', FRIENDLY.no_passcode);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AIError('offline', FRIENDLY.offline);

  let res: Response;
  try {
    res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-journee-passcode': passcode },
      body: JSON.stringify({ task: opts.task, system: opts.system, messages: opts.messages }),
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return { text: '', stop: null, model: '', aborted: true };
    throw new AIError('offline', FRIENDLY.offline);
  }

  if (!res.ok) {
    let code = `http_${res.status}`;
    let message = `The AI service returned an error (${res.status}).`;
    try {
      const j = (await res.json()) as { code?: string; message?: string };
      if (j.code) code = j.code;
      if (j.message) message = j.message;
    } catch {
      // Not our function (e.g. a static host's 404 page)
      if (res.status === 404 || res.status === 405) code = 'no_backend';
    }
    throw new AIError(code, FRIENDLY[code] ?? message);
  }
  if (!res.body || !(res.headers.get('content-type') ?? '').includes('ndjson')) {
    throw new AIError('no_backend', FRIENDLY.no_backend);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let text = '';
  let done: Extract<AIEvent, { t: 'done' }> | null = null;

  const handle = (raw: string) => {
    if (!raw.trim()) return;
    const ev = JSON.parse(raw) as AIEvent;
    if (ev.t === 'text') {
      text += ev.v;
      opts.onText?.(text, ev.v);
    } else if (ev.t === 'done') {
      done = ev;
    } else if (ev.t === 'error') {
      throw new AIError(ev.code, FRIENDLY[ev.code] ?? ev.message);
    }
  };

  try {
    for (;;) {
      const { value, done: finished } = await reader.read();
      if (finished) break;
      buffer += value;
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        handle(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    handle(buffer);
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return { text, stop: null, model: '', aborted: true };
    if (e instanceof AIError) throw Object.assign(e, { partialText: text });
    throw new AIError('stream', 'The connection dropped mid-reply.');
  }

  if (!done) throw new AIError('stream', 'The reply was cut off. Try again.');
  const d = done as Extract<AIEvent, { t: 'done' }>;
  return { text, stop: d.stop, model: d.model, aborted: false };
}
