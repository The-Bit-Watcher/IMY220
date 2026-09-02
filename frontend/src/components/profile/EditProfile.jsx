import React, {useState, useEffect} from 'react';
import { Modal, Form, Button, Alert, Image, Row, Col, Spinner } from 'react-bootstrap';
import { users } from '../../data/mockProfiles';

function EditProfile({show, onHide, userId, onProfileUpdated}){
    const currentUser = users.find(u => u.id === userId);

    const [name, setName] = useState(currentUser?.name || '');
    const [username, setUsername] = useState(currentUser?.username || '');
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [location, setLocation] = useState(currentUser?.location || '');
    const [profileImage, setProfileImage] = useState(currentUser?.profileImage || '');

    const [isDragging, setIsDragging] = useState(false);

    const [validated, setValidated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);


    const processImageFile = (file) => {
        if (file && file.type.startsWith('image/')){
            const previewUrl = URL.createObjectURL(file);
            setProfileImage(previewUrl);
        }else{
            setError('Please upload via image file (PNG, JPG, SVG).')
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processImageFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file){
            processImageFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity === false){
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setValidated(true);
        setIsSubmitting(true);
        setError(null);

        try{
            const userIndex = users.findIndex(user => user.userId === userId);

            if (userIndex !== -1){
                users[userIndex] = {
                    ...users[userIndex],
                    name,
                    username,
                    bio,
                    location,
                    profileImage,
                };
                
                if (onProfileUpdated){
                onProfileUpdated(users[userIndex]);
                }

                onHide();
            
            }else{
                throw new Error('User not found')
            }
        }catch (error){
            console.error(error)
            setError("Faled to save changes. Please try again.")
        }finally{
            setIsSubmitting(false);
        }
    }

    return (
        <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Edit Profile</Modal.Title>
            </Modal.Header>

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form.Group className="mb-4 text-center">
                        <Form.Label className="fw-semibold d-block">Profile Image</Form.Label>
                        <div className="d-flex justify-content-center mb-3">
                            <Image
                                src={profileImage || 'https://via.placeholder.com/120'}
                                alt="Profile Preview"
                                roundedCircle
                                className="border border-3 shadow-sm"
                                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                            />
                        </div>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`p-3 border-2 rounded text-center mb-2 ${
                                isDragging ? 'border-primary bg-light' : 'border-secondary'
                            }`}
                            style={{ borderStyle: 'dashed', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        >
                            <p className="mb-1 text-muted small">
                                Drag & drop a new profile picture here, or click to browse
                            </p>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="d-none"
                                id="profileImageUpload"
                            />
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => document.getElementById('profileImageUpload').click()}
                            >
                                Browse File
                            </Button>
                        </div>
                    </Form.Group>

                    <Row className="g-3 mb-3">
                        <Col md={6}>
                            <Form.Group controlId="editName">
                                <Form.Label className="fw-semibold">Full Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    Name is required.
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="editUsername">
                                <Form.Label className="fw-semibold">Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    Username is required.
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Col md={6}>
                        <Form.Group controlId="editLocation">
                            <Form.Label className="fw-semibold">Location</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="City, Country"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </Form.Group>
                    </Col>

                    <Form.Group className="mb-3" controlId="editBio">
                        <Form.Label className="fw-semibold">Short Bio</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Tell everyone a bit about yourself..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={250}
                        />
                        <Form.Text className="text-muted">
                            {250 - bio.length} characters remaining.
                        </Form.Text>
                    </Form.Group>                 
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <> 
                                <Spinner animation="border" size="sm" className="me-2" />
                                Saving...
                            </>
                        ) : ('Save Changes')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}

export default EditProfile;