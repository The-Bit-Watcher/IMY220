import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from 'react-bootstrap';

function ProfilePreview({ user, showFriendBadge = false, isFavorite = false }) {
  const navigate = useNavigate();

  if (!user) return null;

  const handleProfileClick = () => {
    navigate(`/profile/${user.id}`);
  };

  return (
    <Card 
      className="h-100 shadow-sm border-0 hover-shadow transition" 
      style={{ cursor: 'pointer', maxWidth: '18rem', margin: '0 auto' }}
      onClick={handleProfileClick}
    >
      <Card.Body className="text-center d-flex flex-column align-items-center">
        <img
          src={user.profileImage || 'https://via.placeholder.com/100'}
          alt={user.name}
          className="rounded-circle mb-3 border border-2 border-primary"
          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
        />

        <Card.Title className="mb-0 fs-5 fw-bold">{user.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted small">@{user.username}</Card.Subtitle>

        <div className="mb-2 d-flex gap-1">
          {isFavorite && <Badge bg="warning" text="dark">Favorite</Badge>}
          {showFriendBadge && <Badge bg="info">Friend</Badge>}
        </div>

        <Card.Text className="small text-secondary mb-3 flex-grow-1">
          {user.bio ? (user.bio.length > 70 ? `${user.bio.substring(0, 70)}...` : user.bio) : 'No bio provided.'}
        </Card.Text>

        <div className="w-100 border-top pt-2 mt-auto text-muted small d-flex justify-content-between">
          <span>{user.location || 'Unknown'}</span>
          <span>{user.joinedDate ? new Date(user.joinedDate).getFullYear() : '2024'}</span>
        </div>

        <Button 
          variant="outline-primary" 
          size="sm" 
          className="w-100 mt-3"
          onClick={(e) => {
            e.stopPropagation();
            handleProfileClick();
          }}
        >
          View Profile
        </Button>
      </Card.Body>
    </Card>
  );
}

export default ProfilePreview;