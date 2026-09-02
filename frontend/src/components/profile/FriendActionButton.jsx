import React, { useState } from 'react';
import { Button, Badge } from 'react-bootstrap';

export function FriendActionButton({ currentUserId, targetUserId, initialIsFriend, initialIsFavorite }) {
    const [status, setStatus] = useState(initialIsFriend ? 'friends' : 'none');
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

    if (currentUserId === targetUserId) {
        return <Badge bg="secondary" className="p-2">Your Profile</Badge>;
    }

    return (
        <div className="d-flex align-items-center gap-2">
            {status === 'none' && (
                <Button variant="primary" size="sm" onClick={() => setStatus('pending_sent')}>
                    + Send Friend Request
                </Button>
            )}

            {status === 'pending_sent' && (
                <Badge bg="warning" text="dark" className="p-2">
                    Request Pending
                </Badge>
            )}

            {status === 'friends' && (
                <>
                    <Badge bg="success" className="p-2">Friends</Badge>
                    <Button 
                        variant={isFavorite ? "warning" : "outline-warning"} 
                        size="sm" 
                        onClick={() => setIsFavorite(!isFavorite)}
                    >
                        {isFavorite ? 'Favourite' : 'Add to Favourites'}
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => setStatus('none')}>
                        Unfriend
                    </Button>
                </>
            )}
        </div>
    );
}