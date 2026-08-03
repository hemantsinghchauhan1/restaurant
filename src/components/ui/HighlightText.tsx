import React from 'react';

export function HighlightText({ text, query }: { text: string | null | undefined; query: string }) {
  if (!text) return null;
  const cleanQuery = query.trim().replace(/^#/, '');

  if (!cleanQuery) {
    return <span>{text}</span>;
  }

  try {
    const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-500/35 text-amber-300 font-extrabold px-1 rounded border border-amber-500/40">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  } catch {
    return <span>{text}</span>;
  }
}
