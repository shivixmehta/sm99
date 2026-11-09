import { Fragment, type ReactNode } from 'react';

/**
 * A tiny, safe Markdown renderer for AI replies: paragraphs, headings, bullet and
 * numbered lists, blockquotes, **bold**, *italic* and `code`. It builds React
 * elements (never raw HTML), so model output can't inject markup.
 */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) { blocks.push(<p key={i} className="md-h">{inline(h[2])}</p>); i++; continue; }

    if (/^\s*([-*•])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: ReactNode[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/ : /^\s*([-*•])\s+/).test(lines[i])) {
        items.push(<li key={i}>{inline(lines[i].replace(/^\s*(\d+[.)]|[-*•])\s+/, ''))}</li>);
        i++;
      }
      blocks.push(ordered ? <ol key={`l${i}`}>{items}</ol> : <ul key={`l${i}`}>{items}</ul>);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={`q${i}`}>{inline(quote.join(' '))}</blockquote>);
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|\s*([-*•]|\d+[.)])\s)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={`p${i}`}>{inline(para.join(' '))}</p>);
  }
  return <div className="md">{blocks}</div>;
}

function inline(s: string): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`)/g);
  return parts.map((p, k) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={k}>{p.slice(2, -2)}</strong>;
    if (/^(\*[^*].*\*|_[^_].*_)$/.test(p)) return <em key={k}>{p.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(p)) return <code key={k}>{p.slice(1, -1)}</code>;
    return <Fragment key={k}>{p}</Fragment>;
  });
}
