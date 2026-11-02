import { useEffect, useMemo, useState } from 'react';
import PostPreview from '../common/PostPreview/PostPreview';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';

const DAYS = { week: 7, month: 30 };

// One feed component for both tabs.
// type: 'local' (me + friends, favourites pinned first) | 'global' (everyone)
function Feed({ type, sortBy, timeframe, tag }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());

  // Sorting by comments happens on the server, which knows the comment counts.
  // The parent re-mounts this component (key) when type/sortBy change.
  useEffect(() => {
    let active = true;
    api(`/api/get/${type}?sortBy=${sortBy}`)
      .then((data) => active && setPosts(data.posts))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [type, sortBy]);

  const visible = useMemo(() => {
    const cleanTag = tag.replace(/^#/, '').trim().toLowerCase();
    const cutoff = DAYS[timeframe] ? now - DAYS[timeframe] * 24 * 60 * 60 * 1000 : 0;

    const filtered = posts.filter((p) =>
      (!cleanTag || (p.hashtags || []).some((t) => t.includes(cleanTag))) &&
      (!cutoff || new Date(p.createdAt).getTime() >= cutoff)
    );
    // Local feed: favourites float to the top, keeping the server's order otherwise
    return type === 'local'
      ? [...filtered].sort((a, b) => Number(!!b.isFavorite) - Number(!!a.isFavorite))
      : filtered;
  }, [posts, tag, timeframe, type, now]);

  if (loading) {
    return <p className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">Loading feed...</p>;
  }
  if (error) return <ErrorBox message={`Could not load the feed: ${error}`} />;

  if (visible.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <h2 className="font-semibold text-slate-200 text-base mb-1">Nothing here yet</h2>
        <p className="text-xs text-slate-400">
          {posts.length > 0
            ? 'No posts match these filters. Try clearing them.'
            : type === 'local'
              ? 'Post something or add friends to fill your feed.'
              : 'No one has posted yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visible.map((post) => (
        <PostPreview key={post._id} post={post} badge={post.isFavorite ? '★ Favourite' : null} />
      ))}
    </div>
  );
}

export default Feed;
