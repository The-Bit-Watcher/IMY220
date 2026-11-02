import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Header from '../components/common/Header/Header';
import Feed from '../components/home/Feed';
import RecommendedFriends from '../components/profile/RecommendedFriends';

const TABS = [['local', 'Friends & me'], ['global', 'Global']];

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL is the source of truth for the tag filter, so clicking any #hashtag (even on this page) works
  const tag = searchParams.get('tag') || '';
  const activeTab = searchParams.get('feed') || (tag ? 'global' : 'local');

  const [sortBy, setSortBy] = useState('newest');
  const [timeframe, setTimeframe] = useState('all');

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <h1 className="sr-only">Activity feed</h1>

          <div role="tablist" aria-label="Feed" className="flex border-b border-slate-800 pb-2 gap-2">
            {TABS.map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={activeTab === key}
                onClick={() => setParam('feed', key)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-50'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3 text-xs">
            <div>
              <label htmlFor="feed-sort" className="field-label">Sort</label>
              <select id="feed-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="field-input !py-1.5 !text-xs">
                <option value="newest">Newest first</option>
                <option value="comments">Most commented</option>
              </select>
            </div>
            <div>
              <label htmlFor="feed-time" className="field-label">Posted</label>
              <select id="feed-time" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="field-input !py-1.5 !text-xs">
                <option value="all">Any time</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
              </select>
            </div>
            <div className="flex-1 min-w-[10rem]">
              <label htmlFor="feed-tag" className="field-label">Hashtag</label>
              <div className="flex gap-2">
                <input id="feed-tag" type="text" placeholder="e.g. hiking" value={tag}
                  onChange={(e) => setParam('tag', e.target.value.replace(/^#/, ''))}
                  className="field-input !py-1.5 !text-xs" />
                {tag && (
                  <button type="button" onClick={() => setParam('tag', '')} className="btn btn-secondary !py-1.5">Clear</button>
                )}
              </div>
            </div>
          </div>

          <Feed key={`${activeTab}-${sortBy}`} type={activeTab} sortBy={sortBy} timeframe={timeframe} tag={tag} />
        </div>

        <aside className="space-y-4">
          <RecommendedFriends />
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="font-bold text-slate-200 text-sm mb-2">About the feeds</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Friends &amp; me</strong> shows your posts and your friends' posts, with favourites first.
              <strong> Global</strong> shows everyone. Posts reported more than twice are hidden until an admin reviews them.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default HomePage;
