import React, { useState } from 'react';
import { Card, Badge, Dropdown } from 'react-bootstrap';
import PostImage from './PostImage';
import PostComments from './PostComments';
import EditPostModal from './EditPostModal';
import ReportPostModal from './ReportPostModal';

function PostCard({ 
  post, 
  currentUser = { id: 1, name: "Shaun Marx" },
  users = [],
  comments = [],
  reportReasons = [],
  onHashtagClick,
  onPostClick,
  onUpdatePost,
  onDeletePost,
  onAddComment,
  onReportPost
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const postAuthor = users.find(u => u.id === post.userId) || { name: 'Unknown User' };
  const isOwner = post.userId === currentUser.id;

  const renderHashtags = () => {
    let tags = [];
    if (Array.isArray(post.hashtags)) {
      tags = post.hashtags;
    } else if (post.caption) {
      tags = post.caption.match(/#\w+/g) || [];
    }

    return tags.map((tag, idx) => (
      <Badge 
        key={idx} 
        bg="info" 
        className="me-1 text-dark" 
        style={{ cursor: 'pointer' }}
        onClick={() => onHashtagClick && onHashtagClick(tag)}
      >
        {tag.startsWith('#') ? tag : `#${tag}`}
      </Badge>
    ));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      if (onDeletePost) {
        onDeletePost(post.id);
      }
    }
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom-0 pt-3">
        <div>
          <h6 className="mb-0 fw-bold">{postAuthor.name}</h6>
          <small className="text-muted">
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
          </small>
        </div>

        <Dropdown align="end">
          <Dropdown.Toggle variant="light" size="sm" className="border-0 bg-transparent py-0">
            ⋮
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {isOwner ? (
              <>
                <Dropdown.Item onClick={() => setShowEditModal(true)}>Edit Post</Dropdown.Item>
                <Dropdown.Item onClick={handleDelete} className="text-danger">Delete Post</Dropdown.Item>
              </>
            ) : (
              <Dropdown.Item onClick={() => setShowReportModal(true)} className="text-warning">
                Report Post
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </Card.Header>

      <Card.Body className="pt-2">
        <p className="card-text mb-2">{post.caption}</p>

        <div className="mb-3">{renderHashtags()}</div>

        {post.image && (
          <PostImage 
            src={post.image} 
            alt={post.caption} 
            onClick={() => onPostClick && onPostClick(post.id)} 
          />
        )}

        <PostComments
          postId={post.id}
          comments={comments}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          onAddComment={onAddComment}
          limit={2}
          onViewAllClick={() => onPostClick && onPostClick(post.id)}
        />
      </Card.Body>

      {isOwner && (
        <EditPostModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          onSave={onUpdatePost}
        />
      )}

      {!isOwner && (
        <ReportPostModal
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          postId={post.id}
          reasons={reportReasons}
          onSubmitReport={onReportPost}
        />
      )}
    </Card>
  );
}

export default PostCard;