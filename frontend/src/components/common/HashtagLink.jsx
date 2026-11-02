import { Link } from 'react-router-dom';

// Clickable hashtag: opens the global feed filtered by that tag
function HashtagLink({ tag, className = '' }) {
  const clean = String(tag).replace(/^#/, '');
  return (
    <Link
      to={`/home?tag=${encodeURIComponent(clean)}`}
      onClick={(e) => e.stopPropagation()}
      className={`hashtag ${className}`}
    >
      #{clean}
    </Link>
  );
}

export default HashtagLink;
