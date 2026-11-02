import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import ErrorBox from '../components/common/ErrorBox';
import EditProfile from '../components/profile/EditProfile';
import UserPostsList from '../components/profile/UserPostsList';
import AlbumsList from '../components/profile/AlbumsList';
import FriendsList from '../components/profile/FriendsList';
import RecommendedFriends from '../components/profile/RecommendedFriends';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';
import VerificationCard from '../components/profile/VerificationCard';
import VerifiedBadge from '../components/common/VerifiedBadge';
import { AvatarDisplay } from '../utils/avatarGenerator';
import { getStoredUser } from '../utils/session';
import { api } from '../services/api';
import { useConfirm } from '../context/ConfirmContext';

const tabClass = (active) =>
  `pb-2 transition-all ${active ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`;

function FriendButtons({ status, isFavorite, busy, onAction, onFavorite }) {
  switch (status) {
    case 'none':
      return <button type="button" disabled={busy} onClick={() => onAction('request')} className="btn btn-primary">+ Add friend</button>;
    case 'request_sent':
      return (
        <>
          <span className="px-3 py-1.5 bg-slate-800 text-xs text-slate-400 rounded-lg">Request sent</span>
          <button type="button" disabled={busy} onClick={() => onAction('reject')} className="btn btn-secondary">Cancel request</button>
        </>
      );
    case 'request_received':
      return (
        <>
          <button type="button" disabled={busy} onClick={() => onAction('accept')} className="btn bg-emerald-600 hover:bg-emerald-500 text-white">Accept request</button>
          <button type="button" disabled={busy} onClick={() => onAction('reject')} className="btn btn-secondary">Decline</button>
        </>
      );
    case 'friends':
      return (
        <>
          <button type="button" disabled={busy} onClick={onFavorite} aria-pressed={isFavorite}
            className={`btn ${isFavorite ? 'bg-amber-500 text-black hover:bg-amber-400' : 'btn-secondary'}`}>
            {isFavorite ? '★ Favourite' : '☆ Add favourite'}
          </button>
          <button type="button" disabled={busy} onClick={() => onAction('unfriend')} className="btn btn-ghost-danger">Unfriend</button>
        </>
      );
    default:
      return null;
  }
}

function ProfilePage({ routeUserId }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const me = getStoredUser();
  const viewerIsAdmin = me.role === 'admin';
  const targetUserId = routeUserId || me.userId;

  const [profile, setProfile] = useState(null);
  const [fullAccess, setFullAccess] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [relationshipStatus, setRelationshipStatus] = useState('none');
  const [isFavorite, setIsFavorite] = useState(false);
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [modal, setModal] = useState(null); // null | 'edit' | 'delete' | 'adminEdit'
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const isSelf = relationshipStatus === 'self';

  // Profile first; posts/albums only when we're allowed to see them (self, friends, admins)
  const load = useCallback(() => api(`/api/users/${targetUserId}`).then(async (data) => {
    // Fetch media before showing anything so the profile appears in one go
    const [p, a] = data.fullAccess
      ? await Promise.all([api(`/api/users/${targetUserId}/posts`), api(`/api/users/${targetUserId}/albums`)])
      : [{ posts: [] }, { albums: [] }];
    setProfile(data.user);
    setFullAccess(data.fullAccess);
    setFriendCount(data.friendCount ?? 0);
    setRelationshipStatus(data.relationshipStatus);
    setIsFavorite(!!data.isFavorite);
    setPosts(p.posts);
    setAlbums(a.albums);
  }), [targetUserId]);

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [load]);

  // ---- Friend actions ------------------------------------------------------
  const friendAction = async (action, userId = targetUserId) => {
    const routes = {
      request: [`/api/friends/request/${userId}`, 'POST'],
      accept: [`/api/friends/accept/${userId}`, 'POST'],
      reject: [`/api/friends/reject/${userId}`, 'POST'], // decline incoming OR cancel sent
      unfriend: [`/api/friends/unfriend/${userId}`, 'DELETE'],
    };
    if (action === 'unfriend' && !(await confirm({
      title: 'Unfriend?',
      message: `Remove @${profile.username} from your friends? You'll only see their name and picture afterwards.`,
      confirmLabel: 'Unfriend',
      danger: true,
    }))) return;

    const [endpoint, method] = routes[action];
    setBusy(true);
    setActionError('');
    try {
      await api(endpoint, { method });
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleFavorite = async () => {
    setBusy(true);
    try {
      const data = await api(`/api/friends/favorite/${targetUserId}`, { method: 'POST' });
      setIsFavorite(data.isFavorite);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const adminDeleteUser = async () => {
    if (!(await confirm({
      title: `Delete @${profile.username}?`,
      message: 'This permanently deletes the account with all its posts, albums, comments and friendships.',
      confirmLabel: 'Delete user',
      danger: true,
    }))) return;
    setBusy(true);
    try {
      await api(`/api/admin/users/${targetUserId}`, { method: 'DELETE' });
      navigate('/admin', { replace: true });
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  };

  // ---- Render --------------------------------------------------------------
  if (loading || loadError || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <main className="flex flex-col items-center justify-center p-10 gap-3">
          <p className="text-slate-400 text-sm">{loading ? 'Loading profile...' : loadError || 'Unable to load profile.'}</p>
          {!loading && <Link to="/home" className="btn btn-primary">Back to feed</Link>}
        </main>
      </div>
    );
  }

  const incomingRequests = isSelf ? profile.friendRequests || [] : [];
  const { twitter, github, website } = profile.socialLinks || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <ErrorBox message={actionError} />

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <AvatarDisplay username={profile.name || profile.username} src={profile.profileImage} className="w-24 h-24 text-2xl shrink-0" />

            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-100 m-0 flex items-center justify-center sm:justify-start gap-2">
                    {profile.name}
                    <VerifiedBadge user={profile} size="lg" />
                    {profile.role === 'admin' && (
                      <span className="text-[10px] font-body uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">Admin</span>
                    )}
                  </h1>
                  <p className="text-sm text-slate-400">@{profile.username}</p>
                  {fullAccess && profile.location && <p className="text-xs text-slate-500 mt-0.5">📍 {profile.location}</p>}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {isSelf && <button type="button" onClick={() => setModal('edit')} className="btn btn-secondary">Edit profile</button>}
                  <FriendButtons status={relationshipStatus} isFavorite={isFavorite} busy={busy}
                    onAction={friendAction} onFavorite={toggleFavorite} />
                </div>
              </div>

              {fullAccess ? (
                <>
                  <p className="text-sm text-slate-300 leading-relaxed">{profile.bio || 'No bio yet.'}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-400">
                    <span><strong className="text-slate-200">{posts.length}</strong> posts</span>
                    <span><strong className="text-slate-200">{albums.length}</strong> albums</span>
                    <span><strong className="text-slate-200">{friendCount}</strong> friends</span>
                    {profile.joinedDate && <span>Joined {new Date(profile.joinedDate).toLocaleDateString()}</span>}
                  </div>
                  {(twitter || github || website) && (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs">
                      {twitter && <a href={`https://x.com/${twitter.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="text-link">@{twitter.replace(/^@/, '')}</a>}
                      {github && <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" className="text-link">github/{github}</a>}
                      {website && <a href={website} target="_blank" rel="noreferrer" className="text-link">{website.replace(/^https?:\/\//, '')}</a>}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                  🔒 Only friends can see {profile.name}'s full profile, posts and albums.
                  {relationshipStatus === 'none' && ' Send a friend request to connect.'}
                </p>
              )}
            </div>
          </section>

          {fullAccess && (
            <>
              <div role="tablist" aria-label="Profile sections" className="flex border-b border-slate-800 gap-4 text-sm font-semibold">
                {[['posts', `Posts (${posts.length})`], ['albums', `Albums (${albums.length})`], ['friends', `Friends (${friendCount})`]].map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={activeTab === key} onClick={() => setActiveTab(key)} className={tabClass(activeTab === key)}>
                    {label}
                  </button>
                ))}
              </div>

              <div>
                {isSelf && activeTab !== 'friends' && (
                  <div className="flex justify-end mb-3">
                    <Link to={`/create?type=${activeTab === 'albums' ? 'album' : 'post'}`} className="btn btn-primary">
                      {activeTab === 'albums' ? '+ New album' : '+ New post'}
                    </Link>
                  </div>
                )}
                {activeTab === 'posts' && <UserPostsList posts={posts} emptyText={isSelf ? "You haven't posted anything yet." : 'No posts yet.'} />}
                {activeTab === 'albums' && <AlbumsList albums={albums} />}
                {activeTab === 'friends' && <FriendsList friends={profile.friends} favouriteIds={isSelf ? profile.favouriteIds : []} />}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4">
          {viewerIsAdmin && !isSelf && (
            <section className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <h2 className="font-bold text-amber-300 text-sm m-0">Admin tools</h2>
              <p className="text-[11px] text-slate-400">You can see this full profile because you are an admin.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setModal('adminEdit')} disabled={busy} className="btn btn-secondary flex-1">Edit user</button>
                <button type="button" onClick={adminDeleteUser} disabled={busy} className="btn btn-ghost-danger flex-1">Delete user</button>
              </div>
            </section>
          )}

          {isSelf && incomingRequests.length > 0 && (
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="font-bold text-slate-200 text-sm mb-3">Friend requests ({incomingRequests.length})</h2>
              <ul className="space-y-3">
                {incomingRequests.map((req) => (
                  <li key={req._id} className="flex items-center gap-2">
                    <Link to={`/profile/${req._id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <AvatarDisplay username={req.name || req.username} src={req.profileImage} className="w-9 h-9 shrink-0 text-xs" />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-200 truncate">{req.name}</span>
                        <span className="block text-[10px] text-slate-500 truncate">@{req.username}</span>
                      </span>
                    </Link>
                    <button type="button" disabled={busy} onClick={() => friendAction('accept', req._id)}
                      className="btn !px-2 !py-1 !text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white">Accept</button>
                    <button type="button" disabled={busy} onClick={() => friendAction('reject', req._id)} aria-label={`Decline ${req.name}`}
                      className="btn btn-secondary !px-2 !py-1 !text-[11px]">Decline</button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isSelf && profile.role !== 'admin' && <VerificationCard />}

          {isSelf && <RecommendedFriends onFriendshipChange={load} />}

          {isSelf && (
            <section className="bg-slate-900 border border-rose-500/20 rounded-xl p-4">
              <h2 className="font-bold text-rose-300 text-sm mb-1">Danger zone</h2>
              <p className="text-[11px] text-slate-500 mb-3">Permanently delete your account and everything in it.</p>
              <button type="button" onClick={() => setModal('delete')} className="btn btn-ghost-danger w-full">Delete account</button>
            </section>
          )}
        </aside>
      </main>

      {modal === 'delete' && <DeleteAccountModal username={profile.username} onHide={() => setModal(null)} />}
      {(modal === 'edit' || modal === 'adminEdit') && (
        <EditProfile
          user={profile}
          adminMode={modal === 'adminEdit'}
          onHide={() => setModal(null)}
          onUpdated={(updated) => setProfile((prev) => ({ ...prev, ...updated, friends: prev.friends, friendRequests: prev.friendRequests }))}
        />
      )}
    </div>
  );
}

// Keyed by the URL id so each profile starts with fresh state (tabs, errors, loading)
function ProfilePageRoute() {
  const { id } = useParams();
  return <ProfilePage key={id || 'me'} routeUserId={id} />;
}

export default ProfilePageRoute;
