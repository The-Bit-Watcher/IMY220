import React, {useState} from 'React';
import {Form, Button, ListGroup, InputGroup} from 'react-bootstrap';
import users from '../../data/mockProfile';
import comments from '../../data/mockComments';

function PostComments({postId, currentUserId = 1, limit = null, onViewAllClick}){
    const [commentText, setCommentText] = useState('');
    const [,forceUpdate] = useState({});

    const postComments = comments.filter(c => c.postId === postId);
  const displayedComments = limit ? postComments.slice(0, limit) : postComments;
  const hasMore = limit && postComments.length > limit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      postId,
      userId: currentUserId,
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    comments.unshift(newComment);
    setCommentText('');
    forceUpdate({});
  };

    return (
        <div className="post-comments-section mt-3">
        <ListGroup variant="flush" className="mb-2">
            {displayedComments.length === 0 ? (
            <div className="text-muted small italic py-1">No comments yet.</div>
            ) : (
            displayedComments.map(comment => {
                const author = users.find(u => u.id === comment.userId);
                const authorName = author ? author.name : `User ${comment.userId}`;

                return (
                <ListGroup.Item key={comment.id} className="px-0 py-1 bg-transparent border-0 small">
                    <strong>{authorName}: </strong>
                    <span>{comment.text}</span>
                </ListGroup.Item>
                );
            })
            )}
        </ListGroup>

        {hasMore && onViewAllClick && (
            <Button 
            variant="link" 
            size="sm" 
            className="p-0 text-decoration-none text-muted mb-2 small d-block" 
            onClick={onViewAllClick}
            >
            View all {postComments.length} comments...
            </Button>
        )}

        <Form onSubmit={handleSubmit}>
            <InputGroup size="sm">
            <Form.Control
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
            />
            <Button variant="outline-primary" type="submit" disabled={!commentText.trim()}>
                Post
            </Button>
            </InputGroup>
        </Form>
        </div>
    );
}

export default PostComments;

