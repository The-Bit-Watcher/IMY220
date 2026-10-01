import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/common/Header/Header";
import EditProfile from "../components/profile/EditProfile";
import UserPostsList from "../components/profile/UserPostsList";
import AlbumsList from "../components/profile/AlbumsList";
import FriendsList from "../components/profile/FriendsList";
import RecommendedFriends from "../components/profile/RecommendedFriends";
import DeleteAccountModal from "../components/profile/DeleteAccountModal";
import { AvatarDisplay } from "../utils/avatarGenerator";
import { getStoredUser, authHeaders } from "../utils/session";

const tabClass = (active) =>
  `pb-2 transition-all ${active ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400 hover:text-slate-200"}`;

function ProfilePage() {
  const { id: routeUserId } = useParams();
  const navigate = useNavigate();

  const localUserId = getStoredUser().userId;
  const targetUserId = routeUserId || localUserId;

  const [profile, setProfile] = useState(null);
  const [friendCount, setFriendCount] = useState(0);
  const [relationshipStatus, setRelationshipStatus] = useState("none");
  const [isFavorite, setIsFavorite] = useState(false);
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isSelf = relationshipStatus === "self";

  // Expired token / deleted user → back to login
  const handleAuthFailure = useCallback(
    (status) => {
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        navigate("/");
        return true;
      }
      return false;
    },
    [navigate]
  );

  const fetchProfile = useCallback(async () => {
    const res = await fetch(`/api/users/${targetUserId}`, { headers: authHeaders() });
    if (handleAuthFailure(res.status)) return;
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to load profile");

    setProfile(data.user);
    setFriendCount(data.friendCount ?? 0);
    setRelationshipStatus(data.relationshipStatus);
    setIsFavorite(!!data.isFavorite);
  }, [targetUserId, handleAuthFailure]);

  const fetchMedia = useCallback(async () => {
    const [postsRes, albumsRes] = await Promise.all([
      fetch(`/api/users/${targetUserId}/posts`, { headers: authHeaders() }),
      fetch(`/api/users/${targetUserId}/albums`, { headers: authHeaders() }),
    ]);
    const [postsData, albumsData] = await Promise.all([postsRes.json(), albumsRes.json()]);
    setPosts(postsData.success ? postsData.posts : []);
    setAlbums(albumsData.success ? albumsData.albums : []);
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) {
      navigate("/");
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setActiveTab("posts");

    Promise.all([fetchProfile(), fetchMedia()])
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [targetUserId, fetchProfile, fetchMedia, navigate]);

  // ---- Friend actions ------------------------------------------------------
  const friendAction = async (action, userId = targetUserId) => {
    const routes = {
      request: [`/api/friends/request/${userId}`, "POST"],
      accept: [`/api/friends/accept/${userId}`, "POST"],
      reject: [`/api/friends/reject/${userId}`, "POST"], // decline incoming OR cancel sent
      unfriend: [`/api/friends/unfriend/${userId}`, "DELETE"],
    };
    if (action === "unfriend" && !window.confirm(`Remove @${profile.username} from your friends?`)) return;

    const [endpoint, method] = routes[action];
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method, headers: authHeaders() });
      if (handleAuthFailure(res.status)) return;
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Action failed.");
      }
      await fetchProfile();
    } catch (err) {
      console.error("Friend action failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const toggleFavorite = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/friends/favorite/${targetUserId}`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) setIsFavorite(data.isFavorite);
      else alert(data.message || "Could not update favourite.");
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    } finally {
      setBusy(false);
    }
  };

  // ---- Render --------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <div className="text-center p-10 text-slate-500 text-sm">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <div className="flex flex-col items-center justify-center p-10 gap-3">
          <p className="text-slate-400 text-sm">{error || "Unable to load profile."}</p>
          <button onClick={() => navigate("/home")} className="px-4 py-1.5 bg-indigo-600 text-xs rounded-lg">
            Back to feed
          </button>
        </div>
      </div>
    );
  }

  const incomingRequests = isSelf ? profile.friendRequests || [] : [];
  const { twitter, github, website } = profile.socialLinks || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-left">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ---------- Left: profile + tabs ---------- */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <AvatarDisplay username={profile.name || profile.username} src={profile.profileImage} className="w-24 h-24 text-2xl shrink-0" />

            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-100 m-0 tracking-normal">{profile.name}</h1>
                  <p className="text-sm text-slate-400">@{profile.username}</p>
                  {profile.location && <p className="text-xs text-slate-500 mt-0.5">📍 {profile.location}</p>}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {isSelf && (
                    <button
                      onClick={() => setShowEdit(true)}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200"
                    >
                      Edit Profile
                    </button>
                  )}

                  {relationshipStatus === "none" && (
                    <button disabled={busy} onClick={() => friendAction("request")}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white disabled:opacity-50">
                      + Add Friend
                    </button>
                  )}

                  {relationshipStatus === "request_sent" && (
                    <>
                      <span className="px-3 py-1.5 bg-slate-800 text-xs text-slate-400 rounded-lg">Request Sent</span>
                      <button disabled={busy} onClick={() => friendAction("reject")}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg disabled:opacity-50">
                        Cancel
                      </button>
                    </>
                  )}

                  {relationshipStatus === "request_received" && (
                    <>
                      <button disabled={busy} onClick={() => friendAction("accept")}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-lg text-white disabled:opacity-50">
                        Accept Request
                      </button>
                      <button disabled={busy} onClick={() => friendAction("reject")}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-slate-300 disabled:opacity-50">
                        Decline
                      </button>
                    </>
                  )}

                  {relationshipStatus === "friends" && (
                    <>
                      <button disabled={busy} onClick={toggleFavorite}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${
                          isFavorite ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}>
                        {isFavorite ? "★ Favourite" : "☆ Add Favourite"}
                      </button>
                      <button disabled={busy} onClick={() => friendAction("unfriend")}
                        className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs rounded-lg disabled:opacity-50">
                        Unfriend
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{profile.bio || "No bio provided."}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-400">
                <span><strong className="text-slate-200">{posts.length}</strong> posts</span>
                <span><strong className="text-slate-200">{albums.length}</strong> albums</span>
                <span><strong className="text-slate-200">{friendCount}</strong> friends</span>
              </div>

              {(twitter || github || website) && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs">
                  {twitter && (
                    <a href={`https://x.com/${twitter.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      @{twitter.replace(/^@/, "")}
                    </a>
                  )}
                  {github && (
                    <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      github/{github}
                    </a>
                  )}
                  {website && (
                    <a href={website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      {website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>

          <nav className="flex border-b border-slate-800 gap-4 text-sm font-semibold">
            <button onClick={() => setActiveTab("posts")} className={tabClass(activeTab === "posts")}>
              Posts ({posts.length})
            </button>
            <button onClick={() => setActiveTab("albums")} className={tabClass(activeTab === "albums")}>
              Albums ({albums.length})
            </button>
            <button onClick={() => setActiveTab("friends")} className={tabClass(activeTab === "friends")}>
              Friends ({friendCount})
            </button>
          </nav>

          <div>
            {isSelf && activeTab !== "friends" && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => navigate(`/create?type=${activeTab === "albums" ? "album" : "post"}`)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold"
                >
                  {activeTab === "albums" ? "+ New album" : "+ New post"}
                </button>
              </div>
            )}
            {activeTab === "posts" && (
              <UserPostsList posts={posts} emptyText={isSelf ? "You haven't posted anything yet." : "No posts yet."} />
            )}
            {activeTab === "albums" && <AlbumsList albums={albums} />}
            {activeTab === "friends" && (
              <FriendsList
                friends={profile.friends}
                ownerUsername={profile.username}
                favouriteIds={isSelf ? profile.favouriteIds : []}
              />
            )}
          </div>
        </div>

        {/* ---------- Right: sidebar ---------- */}
        <aside className="space-y-4">
          {isSelf && incomingRequests.length > 0 && (
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="font-bold text-slate-200 text-sm mb-3">Friend requests ({incomingRequests.length})</h3>
              <ul className="space-y-3">
                {incomingRequests.map((req) => (
                  <li key={req._id} className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(`/profile/${req._id}`)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                      <AvatarDisplay username={req.name || req.username} src={req.profileImage} className="w-9 h-9 shrink-0 text-xs" />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-200 truncate">{req.name}</span>
                        <span className="block text-[10px] text-slate-500 truncate">@{req.username}</span>
                      </span>
                    </button>
                    <button disabled={busy} onClick={() => friendAction("accept", req._id)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[11px] font-semibold disabled:opacity-50">
                      Accept
                    </button>
                    <button disabled={busy} onClick={() => friendAction("reject", req._id)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 disabled:opacity-50">
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isSelf && <RecommendedFriends onFriendshipChange={fetchProfile} />}

          {isSelf && (
            <section className="bg-slate-900 border border-rose-500/20 rounded-xl p-4">
              <h3 className="font-bold text-rose-300 text-sm mb-1">Danger zone</h3>
              <p className="text-[11px] text-slate-500 mb-3">Permanently delete your account and everything in it.</p>
              <button onClick={() => setShowDelete(true)}
                className="w-full px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-semibold">
                Delete account
              </button>
            </section>
          )}

          {!isSelf && (
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
              Joined {profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : "recently"}
            </section>
          )}
        </aside>
      </main>

      {showDelete && <DeleteAccountModal username={profile.username} onHide={() => setShowDelete(false)} />}

      {showEdit && (
        <EditProfile
          user={profile}
          onHide={() => setShowEdit(false)}
          onUpdated={(updated) => setProfile((prev) => ({ ...prev, ...updated, friends: prev.friends, friendRequests: prev.friendRequests }))}
        />
      )}
    </div>
  );
}

export default ProfilePage;
