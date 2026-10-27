import React, { useState } from 'react';

// Normalise like the backend does: lowercase, no '#', letters/numbers/_ only
export const cleanTag = (t) => t.trim().replace(/^#+/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');

// Chip-style tag editor. Type a word and press Enter, comma or space to add it.
function TagInput({ tags, onChange, placeholder = 'Add a tag and press Enter', max = 20 }) {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const newTags = raw.split(/[\s,]+/).map(cleanTag).filter(Boolean);
    if (newTags.length === 0) return;
    onChange([...new Set([...tags, ...newTags])].slice(0, max));
    setDraft('');
  };

  const remove = (tag) => onChange(tags.filter((t) => t !== tag));

  const onKeyDown = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus-within:border-indigo-500">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 bg-indigo-500/15 text-indigo-300 text-xs px-2 py-0.5 rounded">
          #{tag}
          <button type="button" onClick={() => remove(tag)} aria-label={`Remove ${tag}`} className="text-indigo-400 hover:text-white">
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        onPaste={(e) => { e.preventDefault(); add(e.clipboardData.getData('text')); }}
        placeholder={tags.length >= max ? `Max ${max} tags` : placeholder}
        disabled={tags.length >= max}
        className="flex-1 min-w-[8rem] bg-transparent text-xs text-slate-200 focus:outline-none py-0.5"
      />
    </div>
  );
}

export default TagInput;
