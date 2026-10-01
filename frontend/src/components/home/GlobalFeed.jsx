import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PostPreview from '../common/PostPreview/PostPreview';

function GlobalFeed({ filterOptions = {} }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    sortBy = 'newest',
    hashtagFilter = '',
    timeframe = 'all',
    searchTerm = ''
  } = filterOptions;

  useEffect(() => {
    const fetchGlobalPosts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token'); // Retrieve stored JWT token
        const response = await fetch('/api/get/global', {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });

        // Expired/invalid token, or user no longer exists (e.g. after re-seeding)
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          navigate('/');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Set posts array depending on API response format
        setPosts(data.posts || data || []);
      } catch (err) {
        console.error('Error fetching global posts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalPosts();
  }, [navigate]);

  const processedPosts = useMemo(() => {
    return posts.filter(post => {
      // 1. Safety Filter: Hide posts with > 2 reports
      if (post.reports && post.reports > 2) return false;

      // 2. Search Term Filter (Title or Caption)
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = post.title?.toLowerCase().includes(query);
        const matchesCaption = post.caption?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCaption) return false;
      }

      // 3. Hashtag Filter
      if (hashtagFilter) {
        const cleanTag = hashtagFilter.replace(/^#/, '').toLowerCase();
        const matchesTag = post.hashtags?.some(tag => tag.toLowerCase().includes(cleanTag)) ||
          post.caption?.toLowerCase().includes(`#${cleanTag}`);
        if (!matchesTag) return false;
      }

      // 4. Timeframe Filter
      if (timeframe !== 'all') {
        const postDate = new Date(post.createdAt || 0);
        const now = new Date();
        const diffInDays = (now - postDate) / (1000 * 60 * 60 * 24);

        if (timeframe === 'week' && diffInDays > 7) return false;
        if (timeframe === 'month' && diffInDays > 30) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'comments') {
        return (b.commentsCount || b.comments?.length || 0) - (a.commentsCount || a.comments?.length || 0);
      }

      // Default: Newest first
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }, [posts, searchTerm, hashtagFilter, timeframe, sortBy]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <p className="text-sm">Loading global feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-red-400">
        <p className="text-sm">Failed to load posts. Please try again later.</p>
      </div>
    );
  }

  if (processedPosts.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <h5 className="font-semibold text-slate-200 text-base mb-1">No global posts found</h5>
        <p className="text-xs text-slate-400">Try adjusting your search criteria or clearing filter controls.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {processedPosts.map(post => {
        const postId = post._id || post.id;
        // Handles populated userId objects as well as flat username/name strings
        const authorName = post.userId?.name || post.userId?.username || post.username || 'Community Member';

        return (
          <div
            key={postId}
            onClick={() => navigate(`/post/${postId}`)}
            className="cursor-pointer transition-transform hover:-translate-y-0.5"
          >
            <PostPreview
              title={post.caption || post.title || 'Untitled Post'}
              username={authorName}
              date={post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
              likes={post.likes || 0}
              img={post.image || 'https://via.placeholder.com/300x200'}
            />
          </div>
        );
      })}
    </div>
  );
}

export default GlobalFeed;