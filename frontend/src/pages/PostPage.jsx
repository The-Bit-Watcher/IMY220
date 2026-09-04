import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Data imports
import { posts, albums, reportReasons } from '../data/mockPosts';
import { users } from '../data/mockProfiles';
import { comments } from '../data/mockComments';

// Component imports
import PostImage from '../components/post/PostImage';
import PostComments from '../components/post/PostComments';
import EditPostModal from '../components/post/EditPost';
import ReportPostModal from '../components/post/ReportPost';

function PostPage({ currentUserId = 1 }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const postId = parseInt(id, 10);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [, forceUpdate] = useState({});

  const post = posts.find(p => p.id === postId);
  const postAuthor = post ? users.find(u => u.id === post.userId) : null;
  const isOwner = post?.userId === currentUserId;

  const associatedAlbums = albums ? albums.filter(a => a.postIds?.includes(postId)) : [];

  const getHashtags = () => {
    if (!post) return [];
    if (Array.isArray(post.hashtags)) return post.hashtags;
    return post.caption ? post.caption.match(/#\w+/g) || [] : [];
  };

  if (!post) {
    return (
      <div>
        <div>
          <h4>Post Not Found</h4>
          <p>The post you are looking for does not exist or has been removed.</p>
          <button
            onClick={() => navigate('/home')}
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  const handleSaveEdit = (updatedPost) => {
    const idx = posts.findIndex(p => p.id === updatedPost.id);
    if (idx !== -1) {
      posts[idx] = updatedPost;
      forceUpdate({});
    }
  };

  const handleDeletePost = () => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      const postIdx = posts.findIndex(p => p.id === postId);
      if (postIdx !== -1) posts.splice(postIdx, 1);

      for (let i = comments.length - 1; i >= 0; i--) {
        if (comments[i].postId === postId) {
          comments.splice(i, 1);
        }
      }

      if (albums) {
        for (let i = albums.length - 1; i >= 0; i--) {
          albums[i].postIds = albums[i].postIds.filter(pid => pid !== postId);
          if (albums[i].postIds.length === 0) {
            albums.splice(i, 1);
          }
        }
      }

      navigate('/home');
    }
  };

  const handleReportSubmit = (reportData) => {
    console.log("Post reported:", reportData);
  };

  return (
    <div>
      <div>
        <nav>
          <button onClick={() => navigate('/home')}>
            Home Feed
          </button>
          <span>/</span>
          <span>Post #{post.id}</span>
        </nav>

        <div>
          <div>
            <div          
              onClick={() => navigate(`/profile/${postAuthor?.id}`)}
            >
              <img 
                src={postAuthor?.profileImage || 'https://via.placeholder.com/40'} 
                alt={postAuthor?.name || 'User'} 
              />
              <div>
                <h6>
                  {postAuthor?.name || 'Unknown User'}
                </h6>
                <p>
                  {post.createdAt ? new Date(post.createdAt).toLocaleString() : post.dates || 'Recently'}
                </p>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                ⋮
              </button>

              {showDropdown && (
                <div>
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => { setShowEditModal(true); setShowDropdown(false); }}
                      >
                        Edit Post
                      </button>
                      <button
                        onClick={() => { handleDeletePost(); setShowDropdown(false); }}
                      >
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setShowReportModal(true); setShowDropdown(false); }}
                    >
                      Report Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <p>
              {post.caption || post.content || post.title}
            </p>

            {getHashtags().length > 0 && (
              <div>
                {getHashtags().map((tag, idx) => (
                  <span 
                    key={idx} 
                    onClick={() => navigate(`/home?tag=${encodeURIComponent(tag)}`)}
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

            {associatedAlbums.length > 0 && (
              <div>
                <span>Part of Albums:</span>
                {associatedAlbums.map(album => (
                  <span key={album.id}>
                    {album.title}
                  </span>
                ))}
              </div>
            )}

            {(post.image || post.imageFile || post.img) && (
              <div>
                <PostImage 
                  src={post.image || post.imageFile || post.img} 
                  alt={post.caption || "Post image"} 
                />
              </div>
            )}

            <hr className="border-slate-800 my-6" />

            <h6>Comments</h6>
            <PostComments
              postId={post.id}
              currentUserId={currentUserId}
              limit={null}
            />
          </div>
        </div>
      </div>

      {isOwner && (
        <EditPostModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          onSave={handleSaveEdit}
        />
      )}

      {!isOwner && (
        <ReportPostModal
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          postId={post.id}
          reasons={reportReasons}
          onSubmitReport={handleReportSubmit}
        />
      )}
    </div>
  );
}

export default PostPage;