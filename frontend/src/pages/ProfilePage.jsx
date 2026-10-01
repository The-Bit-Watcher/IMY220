import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/common/Header/Header";
import EditProfile from "../components/profile/EditProfile";
import PostPreview from "../components/common/PostPreview/PostPreview";
import { AvatarDisplay } from "../utils/avatarGenerator";

function ProfilePage({ currentUserId }) {
  const { id: routeUserId } = useParams();

  // Safely extract user ID from localStorage
  const rawUserData = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const storedUser = rawUserData.data || rawUserData;
  const localUserId = storedUser.userId || storedUser._id || currentUserId;

  // Determine target ID: URL param takes priority if available, otherwise local user
  const targetUserId = routeUserId || localUserId;

  const [profileData, setProfileData] = useState(null);
  const [relationshipStatus, setRelationshipStatus] = useState("none");
  const [isFavorite, setIsFavorite] = useState(false);
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Profile Info
  const fetchProfile = useCallback(async () => {
    if (!targetUserId || targetUserId === "1" || targetUserId === "undefined") {
      console.warn("Invalid targetUserId for fetchProfile:", targetUserId);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${targetUserId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();

      if (data.success) {
        setProfileData(data.user);
        setRelationshipStatus(data.relationshipStatus || (routeUserId ? "none" : "self"));
        setIsFavorite(data.isFavorite || false);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, routeUserId]);

  // Fetch User Media
  const fetchUserMedia = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [postsRes, albumsRes] = await Promise.all([
        fetch(`/api/get/posts/me`, { method: "GET", headers }),
        fetch(`/api/get/albums/me`, { method: "GET", headers }),
      ]);

      if (!postsRes.ok || !albumsRes.ok) throw new Error("Failed fetching media");

      const postsData = await postsRes.json();
      const albumsData = await albumsRes.json();

      if (postsData.success) setPosts(postsData.posts);
      if (albumsData.success) setAlbums(albumsData.albums);
    } catch (err) {
      console.error("Error loading media:", err);
    }
  }, []);

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
      fetchUserMedia();
    }
  }, [targetUserId, fetchProfile, fetchUserMedia]);

  // Friendship Actions
  const handleFriendAction = async (action) => {
    if (!targetUserId) return;
    const token = localStorage.getItem("token");
    let endpoint = "";
    let method = "POST";

    if (action === "request") endpoint = `/api/friends/request/${targetUserId}`;
    else if (action === "accept") endpoint = `/api/friends/accept/${targetUserId}`;
    else if (action === "unfriend") {
      endpoint = `/api/friends/${targetUserId}`;
      method = "DELETE";
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) fetchProfile();
    } catch (err) {
      console.error("Friend action failed:", err);
    }
  };

  const toggleFavorite = async () => {
    if (!targetUserId) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/friends/favorite/${targetUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  if (loading) return <div className="text-center p-10 text-slate-500">Loading Profile...</div>;

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <p className="text-slate-400">Unable to load profile. Please log in again.</p>
      </div>
    );
  }

  const isSelf = !routeUserId || relationshipStatus === "self";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Header currentUserId={localUserId} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <AvatarDisplay username={profileData.username} src={profileData.profilePicture} className="w-24 h-24 text-2xl" />

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-slate-100">
                  {profileData.name} <span className="text-xs text-slate-400">({profileData.pronouns || "n/a"})</span>
                </h1>
                <p className="text-sm text-slate-400">@{profileData.username}</p>
              </div>

              <div>
                {isSelf ? (
                  <button
                    onClick={() => setShowEdit(true)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {relationshipStatus === "none" && (
                      <button
                        onClick={() => handleFriendAction("request")}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white"
                      >
                        + Add Friend
                      </button>
                    )}
                    {relationshipStatus === "request_sent" && (
                      <span className="px-3 py-1 bg-slate-800 text-xs text-slate-400 rounded-lg">Request Sent</span>
                    )}
                    {relationshipStatus === "request_received" && (
                      <button
                        onClick={() => handleFriendAction("accept")}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-lg text-white"
                      >
                        Accept Request
                      </button>
                    )}
                    {relationshipStatus === "friends" && (
                      <>
                        <button
                          onClick={toggleFavorite}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            isFavorite ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isFavorite ? "★ Favorite" : "☆ Add Favorite"}
                        </button>
                        <button
                          onClick={() => handleFriendAction("unfriend")}
                          className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs rounded-lg"
                        >
                          Unfriend
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{profileData.bio || "No bio provided."}</p>
          </div>
        </div>

        <div className="flex border-b border-slate-800 gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-2 transition-all ${activeTab === "posts" ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400"}`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("albums")}
            className={`pb-2 transition-all ${activeTab === "albums" ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400"}`}
          >
            Albums ({albums.length})
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`pb-2 transition-all ${activeTab === "friends" ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400"}`}
          >
            Friends
          </button>
        </div>

        <div>
          {activeTab === "posts" && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-slate-500 text-center py-6 text-sm">No posts yet.</div>
              ) : (
                posts.map((post) => <PostPreview key={post._id} post={post} />)
              )}
            </div>
          )}

          {activeTab === "albums" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {albums.length === 0 ? (
                <div className="col-span-full text-slate-500 text-center py-6 text-sm">No albums created yet.</div>
              ) : (
                albums.map((album) => (
                  <div key={album._id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="h-32 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                      {album.posts?.[0]?.image ? (
                        <img src={album.posts[0].image} alt={album.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-600">Empty Album</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm">{album.title}</h4>
                    <p className="text-xs text-slate-400">{album.posts?.length || 0} Photos</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "friends" && (
            <div>
              {!profileData.friends ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
                  Friends list is hidden. You must be friends with @{profileData.username} to view their connections.
                </div>
              ) : profileData.friends.length === 0 ? (
                <div className="text-slate-500 text-center py-6 text-sm">No friends added yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profileData.friends.map((friend) => (
                    <div key={friend._id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                      <AvatarDisplay username={friend.username} src={friend.profilePicture} className="w-10 h-10" />
                      <div>
                        <h5 className="font-semibold text-slate-200 text-xs">{friend.name}</h5>
                        <p className="text-slate-400 text-xs">@{friend.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <EditProfile key={profileData?._id || showEdit} user={profileData} show={showEdit} onHide={() => setShowEdit(false)} onUpdated={fetchProfile} />
      </main>
    </div>
  );
}

export default ProfilePage;