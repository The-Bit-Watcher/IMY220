import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { users } from '../../data/mockUsers';

function UserFriends({ currentUserId, targetUserId }) {
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const targetUser = users.find(u => u.id === targetUserId);
    const currentUser = users.find(u => u.id === currentUserId);

    const isOwnProfile = currentUserId === targetUserId;
    const isFriends = currentUser?.friendIds?.includes(targetUserId);
    const canViewFriends = isOwnProfile || isFriends;

    useEffect(() => {
        let isMounted = true;

        const fetchFriends = async () => {
            if (!canViewFriends || !targetUser) {
                setIsLoading(false);
                return;
            }

            await Promise.resolve();

            if (isMounted) {
                // Get all user objects that match targetUser's friendIds
                const friendList = users.filter(u => targetUser.friendIds?.includes(u.id));
                setFriends(friendList);
                setIsLoading(false);
            }
        };

        fetchFriends();

        return () => {
            isMounted = false;
        };
    }, [targetUserId, targetUser, canViewFriends]);

    if (!canViewFriends) {
        return (
            <Alert variant="light" className="border text-center my-3">
                You must be friends with this user to view their friends list.
            </Alert>
        );
    }

    if (isLoading) return <Spinner animation="border" size="sm" className="my-3" />;

    return (
        <Card className="my-3 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Friends</h5>
                <Badge bg="primary" pill>{friends.length}</Badge>
            </Card.Header>
            <Card.Body>
                {friends.length === 0 ? (
                    <p className="text-muted mb-0">No friends to show.</p>
                ) : (
                    <Row xs={1} sm={2} md={3} className="g-3">
                        {friends.map(friend => (
                            <Col key={friend.id}>
                                <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                    <img 
                                        src={friend.profileImage} 
                                        alt={friend.name} 
                                        className="rounded-circle border"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                    />
                                    <div className="text-truncate">
                                        <div className="fw-bold text-truncate" style={{ fontSize: '0.9rem' }}>
                                            {friend.name}
                                        </div>
                                        <small className="text-muted">@{friend.username}</small>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
}

export default UserFriends;