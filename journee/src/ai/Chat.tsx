import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db, type ChatMessage } from '../db/schema';
import type { SectionConfig } from '../sections/types';
import { AIError, streamAI } from './client';
import { buildSystemPrompt } from './prompt';
import { Markdown } from './Markdown';
import type { AITask } from './models';

/** How many earlier messages of the thread are sent with each request. */
const HISTORY_LIMIT = 30;

export interface ChatProps {
  section: SectionConfig;
  /** Shown before the first message. */
  greeting?: string;
  placeholder?: string;
  task?: AITask;
  /** Extra lines of context for the system prompt (e.g. "Today's passage: …"). */
  context?: string[];
}

/** A streaming chat with a Section's persona. Messages are saved on-device per Section and thread. */
export function Chat({ section, greeting, placeholder = 'Write a message…', task = 'chat', context }: ChatProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<AIError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Resume the most recent thread for this Section, or start a new one.
  useEffect(() => {
    let live = true;
    db.chats.where('section').equals(section.id).last().then((m) => {
      if (live) setThreadId(m?.threadId ?? crypto.randomUUID());
    });
    return () => { live = false; abortRef.current?.abort(); };
  }, [section.id]);

  const messages = useLiveQuery(
    () => (threadId ? db.chats.where('[section+threadId]').equals([section.id, threadId]).sortBy('createdAt') : []),
    [section.id, threadId],
    [] as ChatMessage[],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, streaming]);

  async function send(text: string) {
    if (!threadId || streaming !== null) return;
    setError(null);
    await db.chats.add({ section: section.id, threadId, role: 'user', content: text, createdAt: Date.now() });
    await reply();
  }

  async function reply() {
    if (!threadId) return;
    const history = await db.chats.where('[section+threadId]').equals([section.id, threadId]).sortBy('createdAt');
    let recent = history.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content }));
    while (recent.length && recent[0].role !== 'user') recent = recent.slice(1);
    if (!recent.length) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStreaming('');
    let partial = '';
    try {
      const res = await streamAI({
        task,
        system: buildSystemPrompt(section, context),
        messages: recent,
        signal: ctrl.signal,
        onText: (full) => { partial = full; setStreaming(full); },
      });
      let text = res.text;
      if (res.stop === 'refusal') text = text || '_I can’t help with that one. Could you put it another way?_';
      if (res.stop === 'max_tokens') text += '\n\n_(I ran out of room there. Ask me to continue.)_';
      if (res.aborted) text = partial ? partial + ' …' : '';
      if (text.trim()) {
        await db.chats.add({ section: section.id, threadId, role: 'assistant', content: text, createdAt: Date.now() });
      }
    } catch (e) {
      const err = e instanceof AIError ? e : new AIError('unknown', (e as Error).message);
      if (partial.trim()) {
        await db.chats.add({ section: section.id, threadId, role: 'assistant', content: partial + ' …', createdAt: Date.now() });
      }
      setError(err);
    } finally {
      abortRef.current = null;
      setStreaming(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    void send(text);
  }

  function newThread() {
    abortRef.current?.abort();
    setError(null);
    setThreadId(crypto.randomUUID());
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <div className="chat" style={{ '--accent': section.colour } as CSSProperties}>
      <div className="chat__log" aria-live="polite">
        {greeting && messages.length === 0 && (
          <div className="bubble bubble--assistant"><Markdown text={greeting} /></div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble bubble--${m.role}`}>
            {m.role === 'assistant' ? <Markdown text={m.content} /> : <p>{m.content}</p>}
          </div>
        ))}
        {streaming !== null && (
          <div className="bubble bubble--assistant">
            {streaming ? <Markdown text={streaming} /> : <span className="typing" aria-label="Thinking"><i /><i /><i /></span>}
          </div>
        )}
        {error && (
          <div className="chat__error" role="alert">
            <p>{error.message}</p>
            <div className="row">
              {(error.code === 'no_passcode' || error.code === 'bad_passcode') && (
                <Link className="btn btn--ghost" to="/settings">Open Settings</Link>
              )}
              {lastIsUser && <button className="btn btn--ghost" onClick={() => { setError(null); void reply(); }}>Try again</button>}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="chat__composer" onSubmit={onSubmit}>
        <textarea
          className="input chat__input"
          rows={1}
          value={input}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSubmit(e); }
          }}
        />
        {streaming !== null ? (
          <button type="button" className="btn btn--ghost" onClick={() => abortRef.current?.abort()}>Stop</button>
        ) : (
          <button type="submit" className="btn" disabled={!input.trim() || !threadId}>Send</button>
        )}
      </form>
      {messages.length > 0 && streaming === null && (
        <button className="link-btn small" onClick={newThread}>Start a new conversation</button>
      )}
    </div>
  );
}
