import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

function EditPostModal({ show, onHide, post, onSave }) {
  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(
    Array.isArray(post?.hashtags) ? post.hashtags.join(' ') : post?.hashtags || ''
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format hashtags string into a clean array
    const formattedTags = hashtags
      .split(' ')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

    onSave({
      ...post,
      caption,
      hashtags: formattedTags
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered key={post?.id}>
      <Modal.Header closeButton>
        <Modal.Title className="h5">Edit Post</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="editCaption">
            <Form.Label className="fw-semibold">Description / Caption</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="editHashtags">
            <Form.Label className="fw-semibold">Hashtags</Form.Label>
            <Form.Control
              type="text"
              placeholder="#react #javascript #webdev"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
            <Form.Text className="text-muted">Separate hashtags with spaces.</Form.Text>
          </Form.Group>

          <div className="p-2 bg-light rounded text-muted small border">
            Note: Post media images cannot be changed after publication.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit">Save Changes</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default EditPostModal;