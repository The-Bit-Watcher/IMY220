import React, {useState} from "react";
import {Modal, Form, Button, Alert, Image, Spinner} from 'react-bootstrap';
import { posts } from '../../data/mockPosts';

function CreatePost({show, onHide, onPostCreated, currentUserId = 1}){

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [validated, setValidated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (file){
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    }

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
    }

    const resetForm = () => {
        setTitle('');
        setContent('');
        setCategory('General');
        setImage(null);
        setImagePreview(null);
        setValidated(false);
        setError(null);
    }

    const handleClose = () => {
        resetForm();
        onHide();
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (form.checkValidity() === false){
            event.stopPropagation();
            setValidated(true);
            return;
        }

        setValidated(true);
        setIsSubmitting(true);
        setError(null);

        const newPost = {
            id: Date.now(), // Temporary unique key
            userId: currentUserId,
            title,
            content,
            category,
            imageFile: image,
            img: imagePreview || null, // Will hold file URL or backend image link
            likes: 0,
            dates: new Date().toISOString().split('T')[0]
        };

        try {
            await Promise.resolve(newPost);

            if (onPostCreated){
                onPostCreated(newPost);
            }

            handleClose();
        } catch (error) {
            console.error(error);
            setError('Failed to create post. Please try again')
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Create New Post</Modal.Title>
            </Modal.Header>

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form.Group className="mb-3" controlId="postTitle">
                        <Form.Label className="fw-semibold">Title</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="What's on your mind?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            minLength={3}
                        />
                        <Form.Control.Feedback type="invalid">
                            Please provide a post title (at least 3 characters).
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="postCategory">
                        <Form.Label className="fw-semibold">Category</Form.Label>
                        <Form.Select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="General">General</option>
                            <option value="Technology">Technology</option>
                            <option value="Design">Design</option>
                            <option value="Tutorial">Tutorial</option>
                            <option value="Personal">Personal</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="postContent">
                        <Form.Label className="fw-semibold">Content</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Write your post details here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                        <Form.Control.Feedback type="invalid">
                            Post content cannot be empty.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="postImage">
                        <Form.Label className="fw-semibold">Attach Image (Optional)</Form.Label>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </Form.Group>

                    {imagePreview && (
                        <div className="position-relative mb-3 text-center border rounded p-2 bg-light">
                            <Image src={imagePreview} alt="Preview" fluid style={{ maxHeight: '200px' }} />
                            <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0 m-2"
                                onClick={handleRemoveImage}
                            >
                                ✕ Remove
                            </Button>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Publishing...
                            </>
                        ) : (
                            'Publish Post'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );

}

export default CreatePost;