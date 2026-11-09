/**
 * Journée AI proxy: the only server code in the app.
 *
 * - Requires the personal passcode (env JOURNEE_PASSCODE) in the `x-journee-passcode` header.
 * - Holds the Anthropic API key (env ANTHROPIC_API_KEY); it never reaches the browser.
 * - Picks the model from the task (src/ai/models.ts) and enforces size limits.
 * - Streams the reply back as newline-delimited JSON (see src/ai/protocol.ts).
 * - Set JOURNEE_MOCK_AI=1 to stream a canned reply without calling Anthropic (free local testing).
 */
import Anthropic from '@anthropic-ai/sdk';
import { LIMITS, TASK_MODELS, isTask } from '../../src/ai/models';
import type { AIEvent, AIMessage, AIRequest } from '../../src/ai/protocol';

declare const process: { env: Record<string, string | undefined> };

export const config = { path: '/api/ai' };

const encoder = new TextEncoder();
const line = (e: AIEvent) => encoder.encode(JSON.stringify(e) + '\n');

function json(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ code, message }), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** Constant-time passcode check: compare SHA-256 digests so length and content don't leak through timing. */
async function passcodeMatches(given: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all(
    [given, expected].map(async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(s)))),
  );
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function validate(body: unknown): AIRequest | string {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object.';
  const b = body as Partial<AIRequest>;
  if (!isTask(b.task)) return 'Unknown task.';
  if (typeof b.system !== 'string' || b.system.length > LIMITS.maxSystemChars) return 'System prompt missing or too long.';
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > LIMITS.maxMessages) {
    return 'Messages missing or too many.';
  }
  let total = b.system.length;
  for (const m of b.messages as AIMessage[]) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim()) {
      return 'Malformed message.';
    }
    total += m.content.length;
  }
  if (total > LIMITS.maxTotalChars) return 'Conversation too long.';
  if (b.messages[0].role !== 'user') return 'First message must be from the user.';
  return { task: b.task, system: b.system, messages: b.messages };
}

function mockStream(req: AIRequest): ReadableStream<Uint8Array> {
  const last = req.messages[req.messages.length - 1].content;
  const reply =
    `*(Mock reply, no AI was called.)* You said: “${last.slice(0, 200)}”. ` +
    'Streaming works if these words arrive a few at a time.';
  const words = reply.split(/(?<= )/);
  return new ReadableStream({
    async start(controller) {
      for (const w of words) {
        controller.enqueue(line({ t: 'text', v: w }));
        await new Promise((r) => setTimeout(r, 30));
      }
      controller.enqueue(line({ t: 'done', stop: 'end_turn', model: 'mock' }));
      controller.close();
    },
  });
}

function anthropicStream(req: AIRequest, apiKey: string, signal: AbortSignal): ReadableStream<Uint8Array> {
  const cfg = TASK_MODELS[req.task];
  const client = new Anthropic({ apiKey });

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client.beta.messages.stream(
          {
            model: cfg.model,
            max_tokens: cfg.maxTokens,
            system: req.system,
            messages: req.messages,
            output_config: { effort: cfg.effort },
            ...(cfg.fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
          },
          { signal },
        );
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(line({ t: 'text', v: event.delta.text }));
          }
        }
        const final = await stream.finalMessage();
        controller.enqueue(line({ t: 'done', stop: final.stop_reason, model: final.model }));
      } catch (err) {
        if (signal.aborted) {
          // The app pressed Stop; nothing more to send.
        } else if (err instanceof Anthropic.AuthenticationError) {
          controller.enqueue(line({ t: 'error', code: 'bad_api_key', message: 'The server’s Anthropic API key was rejected.' }));
        } else if (err instanceof Anthropic.RateLimitError) {
          controller.enqueue(line({ t: 'error', code: 'rate_limited', message: 'Too many requests right now. Try again in a minute.' }));
        } else if (err instanceof Anthropic.APIError) {
          console.error('Anthropic API error', err.status, err.message);
          controller.enqueue(line({ t: 'error', code: 'upstream', message: `The AI service had a problem (${err.status ?? 'network'}).` }));
        } else {
          console.error('Unexpected error', err);
          controller.enqueue(line({ t: 'error', code: 'internal', message: 'Something went wrong on the server.' }));
        }
      } finally {
        try { controller.close(); } catch { /* already closed by a client disconnect */ }
      }
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, 'method', 'Use POST.');

  const expected = process.env.JOURNEE_PASSCODE;
  if (!expected) return json(500, 'not_configured', 'JOURNEE_PASSCODE is not set on the server.');
  if (!(await passcodeMatches(request.headers.get('x-journee-passcode') ?? '', expected))) {
    return json(401, 'bad_passcode', 'Wrong passcode.');
  }

  const raw = await request.text();
  if (raw.length > LIMITS.maxTotalChars + LIMITS.maxSystemChars + 10_000) return json(413, 'too_large', 'Request too large.');
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, 'bad_json', 'Body is not valid JSON.');
  }
  const req = validate(body);
  if (typeof req === 'string') return json(400, 'bad_request', req);

  const mock = process.env.JOURNEE_MOCK_AI === '1';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!mock && !apiKey) return json(500, 'not_configured', 'ANTHROPIC_API_KEY is not set on the server.');

  const body$ = mock ? mockStream(req) : anthropicStream(req, apiKey!, request.signal);
  return new Response(body$, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
