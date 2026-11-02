import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { AvatarDisplay } from '../../utils/avatarGenerator';

const GROUPS = [
  ['users', 'People'],
  ['posts', 'Posts'],
  ['albums', 'Albums'],
  ['hashtags', 'Hashtags'],
];

// Turns one search result into the link it opens + what to show in the dropdown
function toItem(type, r) {
  switch (type) {
    case 'users':
      return { href: `/profile/${r._id}`, label: r.name, sub: `@${r.username}${r.verified ? ' · verified' : ''}`, avatar: r };
    case 'posts':
      return { href: `/post/${r._id}`, label: r.caption, sub: `by @${r.userId?.username || 'unknown'}`, image: r.image };
    case 'albums':
      return { href: `/album/${r._id}`, label: r.title, sub: `${r.postCount} photo${r.postCount === 1 ? '' : 's'}`, image: r.coverImage };
    default:
      return { href: `/home?tag=${encodeURIComponent(r.tag)}`, label: `#${r.tag}`, sub: `${r.count} post${r.count === 1 ? '' : 's'}` };
  }
}

// Search box with autocomplete. Enter (with nothing highlighted) opens the full results page.
function SearchBox({ className = '', onNavigate }) {
  const navigate = useNavigate();
  const inputId = useId();
  const listId = useId();
  const boxRef = useRef(null);

  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  const hasQuery = query.trim().length >= 2;
  const visibleGroups = hasQuery ? groups : [];
  const items = visibleGroups.flatMap((g) => g.items);
  // Index of each group's first option, for keyboard highlighting across groups
  const groupStart = visibleGroups.map((_, gi) => visibleGroups.slice(0, gi).reduce((n, g) => n + g.items.length, 0));

  // Debounced suggestions while typing
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api(`/api/search?q=${encodeURIComponent(q)}&limit=4`);
        if (cancelled) return;
        setGroups(
          GROUPS.map(([type, title]) => ({ type, title, items: (data[type] || []).map((r) => toItem(type, r)) }))
            .filter((g) => g.items.length > 0)
        );
        setActive(-1);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Close when clicking elsewhere
  useEffect(() => {
    const onDown = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const go = (href) => {
    setOpen(false);
    setQuery('');
    onNavigate?.();
    navigate(href);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (active >= 0 && items[active]) return go(items[active].href);
    if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const showDropdown = open && hasQuery;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form role="search" onSubmit={onSubmit}>
        <label htmlFor={inputId} className="sr-only">Search people, posts, albums and hashtags</label>
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder="Search people, posts, albums, #tags"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="field-input !py-2 !text-xs !rounded-xl"
        />
      </form>

      {showDropdown && (
        <div id={listId} role="listbox"
          className="absolute left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading && visibleGroups.length === 0 && <p className="px-4 py-3 text-xs text-slate-400">Searching...</p>}
          {!loading && visibleGroups.length === 0 && (
            <p className="px-4 py-3 text-xs text-slate-400">No matches for “{query.trim()}”.</p>
          )}

          {visibleGroups.map((group, gi) => (
            <div key={group.type} className="py-1 border-b border-slate-800 last:border-b-0">
              <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{group.title}</p>
              {group.items.map((item, ii) => {
                const i = groupStart[gi] + ii;
                return (
                  <Link
                    key={item.href}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    to={item.href}
                    onClick={(e) => { e.preventDefault(); go(item.href); }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 px-4 py-2 ${active === i ? 'bg-slate-800' : ''}`}
                  >
                    {item.avatar && <AvatarDisplay username={item.avatar.name} src={item.avatar.profileImage} className="w-8 h-8 text-[10px] shrink-0" />}
                    {item.image !== undefined && (
                      item.image
                        ? <img src={item.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                        : <span className="w-8 h-8 rounded bg-slate-800 shrink-0" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-100 truncate">{item.label}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{item.sub}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}

          <Link to={`/search?q=${encodeURIComponent(query.trim())}`}
            onClick={(e) => { e.preventDefault(); go(`/search?q=${encodeURIComponent(query.trim())}`); }}
            className="block px-4 py-2.5 text-xs font-semibold text-link bg-slate-950/60">
            See all results for “{query.trim()}” →
          </Link>
        </div>
      )}
    </div>
  );
}

export default SearchBox;
