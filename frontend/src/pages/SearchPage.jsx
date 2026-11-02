import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import PostPreview from '../components/common/PostPreview/PostPreview';
import HashtagLink from '../components/common/HashtagLink';
import VerifiedBadge from '../components/common/VerifiedBadge';
import ErrorBox from '../components/common/ErrorBox';
import { AvatarDisplay } from '../utils/avatarGenerator';
import { api } from '../services/api';

const TYPES = [
  ['all', 'All'],
  ['users', 'People'],
  ['posts', 'Posts'],
  ['albums', 'Albums'],
  ['hashtags', 'Hashtags'],
];

function Section({ title, count, children }) {
  if (!count) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-slate-200 m-0">{title} <span className="text-slate-500 font-normal">({count})</span></h2>
      {children}
    </section>
  );
}

// Fetches and shows results for one query. Re-mounted (key) whenever the query or type changes.
function SearchResults({ q, type }) {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=30`)
      .then((data) => active && setResults(data))
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [q, type]);

  if (error) return <ErrorBox message={error} />;
  if (!results) return <p className="text-sm text-slate-400">Searching...</p>;

  const { users, posts, albums, hashtags } = results;
  if (users.length + posts.length + albums.length + hashtags.length === 0) {
    return <p className="text-sm text-slate-400">No results. Try a different word.</p>;
  }

  return (
    <div className="space-y-8">
      <Section title="People" count={users.length}>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {users.map((u) => (
            <li key={u._id}>
              <Link to={`/profile/${u._id}`} className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-xl p-3">
                <AvatarDisplay username={u.name} src={u.profileImage} className="w-10 h-10 text-xs shrink-0" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-100"><span className="truncate">{u.name}</span><VerifiedBadge user={u} /></span>
                  <span className="block text-xs text-slate-500 truncate">@{u.username}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Hashtags" count={hashtags.length}>
        <div className="flex flex-wrap gap-3">
          {hashtags.map((h) => (
            <span key={h.tag} className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-sm">
              <HashtagLink tag={h.tag} /> <span className="text-xs text-slate-500">{h.count}</span>
            </span>
          ))}
        </div>
      </Section>

      <Section title="Albums" count={albums.length}>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {albums.map((a) => (
            <li key={a._id}>
              <Link to={`/album/${a._id}`} className="block bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-xl overflow-hidden">
                <div className="h-32 bg-slate-950">
                  {a.coverImage && <img src={a.coverImage} alt="" loading="lazy" className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-slate-100 truncate">{a.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{a.description}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{a.postCount} photos · by @{a.userId?.username || 'unknown'}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Posts" count={posts.length}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => <PostPreview key={p._id} post={p} />)}
        </div>
      </Section>
    </div>
  );
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').trim();
  const type = searchParams.get('type') || 'all';

  const submit = (e) => {
    e.preventDefault();
    const next = new FormData(e.currentTarget).get('q').trim();
    setSearchParams({ q: next, type });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* key={q}: the box shows the current query after searching from the header */}
        <form key={q} role="search" onSubmit={submit} className="flex gap-2">
          <label htmlFor="search-page-input" className="sr-only">Search</label>
          <input id="search-page-input" name="q" type="search" defaultValue={q}
            placeholder="Search people, posts, albums, #tags" className="field-input" />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div role="tablist" aria-label="Result type" className="flex flex-wrap gap-2">
          {TYPES.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={type === key}
              onClick={() => setSearchParams({ q, type: key })}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                type === key ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div>
          <h1 className="text-xl font-bold m-0">{q ? <>Results for “{q}”</> : 'Search'}</h1>
          <p className="text-xs text-slate-500 mt-1">Small typos are fine: “snuset” still finds “sunset”.</p>
        </div>

        {q ? <SearchResults key={`${q}|${type}`} q={q} type={type} /> : (
          <p className="text-sm text-slate-400">Type something above to search people, posts, albums and hashtags.</p>
        )}
      </main>
    </div>
  );
}

export default SearchPage;
