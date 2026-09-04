import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { users } from '../data/mockProfiles'; 

import Header from '../components/common/Header/Header';
import EditProfile from '../components/profile/EditProfile';
import CreatePosts from '../components/profile/CreatePosts';
import { FriendActionButton } from '../components/profile/FriendActionButton';
import UserFriends from '../components/profile/FriendsList';
import UserPosts from '../components/profile/UserPostsList';

function ProfilePage({ currentUserId = 1 }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const targetUserId = id ? parseInt(id, 10) : currentUserId;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [, forceUpdate] = useState({});

  const targetUser = users.find(u => u.id === targetUserId);
  const currentUser = users.find(u => u.id === currentUserId);

  if (!targetUser) {
    return (
      <div>
        <Header currentUserId={currentUserId} />
        <div>
          <h4>User Not Found</h4>
          <p>The requested profile does not exist.</p>
          <button
            onClick={() => navigate('/home')}
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === targetUserId;
  const isFriend = currentUser?.friendIds?.includes(targetUserId);
  const isFavorite = currentUser?.favoriteIds?.includes(targetUserId);

  return (
    <div>
      <Header currentUserId={currentUserId} />

      <main>
        <div>
          <div>
            <img
              src={targetUser.profileImage || 'https://via.placeholder.com/150'}
              alt={targetUser.name}
            />

            <div>
              <div>
                <div>
                  <h1>{targetUser.name}</h1>
                  <p>@{targetUser.username}</p>
                </div>

                <div>
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => setShowCreatePostModal(true)}

                      >
                        Create Post
                      </button>
                      <button
                        onClick={() => setShowEditModal(true)}
                      >
                        Edit Profile
                      </button>
                    </>
                  ) : (
                    <FriendActionButton
                      currentUserId={currentUserId}
                      targetUserId={targetUserId}
                      initialIsFriend={isFriend}
                      initialIsFavorite={isFavorite}
                    />
                  )}
                </div>
              </div>

              <p>
                {targetUser.bio || 'No bio provided.'}
              </p>

              <div>
                {targetUser.location && <span>{targetUser.location}</span>}
                {targetUser.joinedDate && (
                  <span>Joined {new Date(targetUser.joinedDate).toLocaleDateString()}</span>
                )}
                <span>{targetUser.friendIds?.length || 0} Friends</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => setActiveTab('posts')}>
            Posts
          </button>
          <button
            onClick={() => setActiveTab('friends')}>
            Friends
          </button>
        </div>

        <div>
          {activeTab === 'posts' && <UserPosts userId={targetUserId} />}
          {activeTab === 'friends' && (
            <UserFriends currentUserId={currentUserId} targetUserId={targetUserId} />
          )}
        </div>

        {isOwnProfile && (
          <EditProfile
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            userId={currentUserId}
            onProfileUpdated={() => forceUpdate({})}
          />
        )}

        {isOwnProfile && (
          <CreatePosts
            show={showCreatePostModal}
            onHide={() => setShowCreatePostModal(false)}
            currentUserId={currentUserId}
            onPostCreated={() => forceUpdate({})}
          />
        )}
      </main>
    </div>
  );
}

export default ProfilePage;