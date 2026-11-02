import { Link } from 'react-router-dom';
import HashtagLink from '../HashtagLink';
import VerifiedBadge from '../VerifiedBadge';
import { AvatarDisplay } from '../../../utils/avatarGenerator';

// Post summary card used by the feeds and search results
function PostPreview({ post, badge }) {
  const author = post.userId && typeof post.userId === 'object' ? post.userId : null;
  const authorName = author?.name || author?.username || 'Unknown user';

  return (
    <article className="relative bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-colors">
      {badge && (
        <span className="absolute top-3 right-3 z-10 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
      )}

      <Link to={`/post/${post._id}`} className="block aspect-video overflow-hidden bg-slate-950 group">
        <img src={post.image} alt={post.caption} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </Link>

      <div className="p-4 space-y-3">
        {author && (
          <Link to={`/profile/${author._id}`} className="inline-flex items-center gap-2 group">
            <AvatarDisplay username={authorName} src={author.profileImage} className="w-7 h-7 text-[10px]" />
            <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">{authorName}</span>
            <VerifiedBadge user={author} />
            <span className="text-[11px] text-slate-500">@{author.username}</span>
          </Link>
        )}

        <Link to={`/post/${post._id}`} className="block text-sm text-slate-200 hover:text-slate-50 line-clamp-2">
          {post.caption}
        </Link>

        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
            {post.hashtags.map((tag) => <HashtagLink key={tag} tag={tag} />)}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-3">
            <span aria-label={`${post.likes || 0} likes`}>♥ {post.likes || 0}</span>
            {post.commentCount !== undefined && <span aria-label={`${post.commentCount} comments`}>💬 {post.commentCount}</span>}
          </span>
          <time dateTime={post.createdAt}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</time>
        </div>
      </div>
    </article>
  );
}

export default PostPreview;
