import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import TagInput, { cleanTag } from '../components/common/TagInput';
import PostPicker from '../components/album/PostPicker';
import { resizeImage } from '../utils/image';
import { authHeaders, getStoredUser } from '../utils/session';

const inputClass =
  'w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500';
const labelClass = 'block text-xs font-semibold text-slate-300 mb-1.5';

function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 text-xs rounded-lg">{message}</div>;
}

// ---------------------------------------------------------------------------
// New post
// ---------------------------------------------------------------------------
function CreatePostForm({ myAlbums, preselectedAlbumId }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [image, setImage] = useState('');
  const [imageMode, setImageMode] = useState('upload'); // upload | url
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState([]);
  const [albumIds, setAlbumIds] = useState(preselectedAlbumId ? [preselectedAlbumId] : []);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // #tags typed in the caption are added automatically
  const captionTags = [...caption.matchAll(/#(\w+)/g)].map((m) => cleanTag(m[1])).filter(Boolean);
  const allTags = [...new Set([...tags, ...captionTags])];

  const handleFile = async (file) => {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      setImage(await resizeImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const finalImage = imageMode === 'upload' ? image : imageUrl.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalImage) return setError('Please add an image.');
    if (imageMode === 'url' && !/^https?:\/\/\S+$/.test(finalImage)) return setError('Image link must start with http:// or https://');
    if (!caption.trim()) return setError('Please write a caption.');

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/create/posts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ caption: caption.trim(), image: finalImage, hashtags: allTags, albumIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || `Could not create post (${res.status}).`);
      navigate(`/post/${data.post._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ErrorBox message={error} />

      {/* Image */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass + ' mb-0'}>Image *</label>
          <div className="flex gap-1 text-[11px]">
            {['upload', 'url'].map((m) => (
              <button key={m} type="button" onClick={() => setImageMode(m)}
                className={`px-2 py-0.5 rounded ${imageMode === m ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                {m === 'upload' ? 'Upload' : 'Link'}
              </button>
            ))}
          </div>
        </div>

        {imageMode === 'upload' ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed overflow-hidden transition-colors ${
              isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full max-h-96 object-contain" />
                <button type="button" onClick={(e) => { e.stopPropagation(); setImage(''); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/70 hover:bg-black text-xs rounded">
                  Remove
                </button>
              </>
            ) : (
              <div className="py-14 text-center text-slate-400 text-xs">
                {processing ? 'Processing image...' : 'Drag & drop an image here, or click to browse'}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input type="url" placeholder="https://example.com/photo.jpg" value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)} className={inputClass} />
            {/^https?:\/\//.test(imageUrl) && (
              <img src={imageUrl} alt="Preview" className="w-full max-h-96 object-contain rounded-xl bg-slate-950" />
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      <div>
        <div className="flex justify-between">
          <label className={labelClass}>Caption *</label>
          <span className="text-[10px] text-slate-500">{2200 - caption.length}</span>
        </div>
        <textarea rows={3} maxLength={2200} value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder="Say something about this photo... #hashtags work here too"
          className={`${inputClass} resize-none`} />
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>Tags</label>
        <TagInput tags={tags} onChange={setTags} />
        {captionTags.some((t) => !tags.includes(t)) && (
          <p className="mt-1 text-[11px] text-slate-500">
            From caption: {captionTags.filter((t) => !tags.includes(t)).map((t) => `#${t}`).join(' ')}
          </p>
        )}
      </div>

      {/* Albums */}
      <div>
        <label className={labelClass}>Add to albums <span className="text-slate-500 font-normal">(optional — the post's tags are added to the album)</span></label>
        {myAlbums.length === 0 ? (
          <p className="text-xs text-slate-500">You don't have any albums yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myAlbums.map((a) => {
              const on = albumIds.includes(a._id);
              return (
                <button key={a._id} type="button"
                  onClick={() => setAlbumIds(on ? albumIds.filter((x) => x !== a._id) : [...albumIds, a._id])}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    on ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}>
                  {on ? '✓ ' : ''}{a.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button type="submit" disabled={submitting || processing}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Publishing...' : 'Publish post'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// New album
// ---------------------------------------------------------------------------
function CreateAlbumForm({ myPosts }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [postIds, setPostIds] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tags that will be auto-added from the selected posts
  const autoTags = [...new Set(
    myPosts.filter((p) => postIds.includes(p._id)).flatMap((p) => p.hashtags || [])
  )].filter((t) => !tags.includes(t));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please give the album a title.');

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/create/album', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title: title.trim(), description: description.trim(), hashtags: tags, postIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || `Could not create album (${res.status}).`);
      navigate(`/album/${data.album._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ErrorBox message={error} />

      <div>
        <label className={labelClass}>Title *</label>
        <input type="text" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Summer in Cape Town" className={inputClass} />
      </div>

      <div>
        <div className="flex justify-between">
          <label className={labelClass}>Description</label>
          <span className="text-[10px] text-slate-500">{500 - description.length}</span>
        </div>
        <textarea rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this album about?" className={`${inputClass} resize-none`} />
      </div>

      <div>
        <label className={labelClass}>Tags</label>
        <TagInput tags={tags} onChange={setTags} />
        {autoTags.length > 0 && (
          <p className="mt-1 text-[11px] text-slate-500">
            Auto-added from selected photos: {autoTags.map((t) => `#${t}`).join(' ')}
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          Photos <span className="text-slate-500 font-normal">({postIds.length} selected — you can add more later)</span>
        </label>
        <div className="max-h-80 overflow-y-auto pr-1">
          <PostPicker posts={myPosts} selected={postIds} onChange={setPostIds}
            emptyText="You haven't posted anything yet. You can create an empty album and add photos later." />
        </div>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Creating...' : 'Create album'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function CreatePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') === 'album' ? 'album' : 'post';
  const preselectedAlbumId = searchParams.get('album');

  const [myAlbums, setMyAlbums] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { userId } = getStoredUser();
    if (!userId || !localStorage.getItem('token')) {
      navigate('/');
      return;
    }
    let active = true;
    Promise.all([
      fetch('/api/get/albums/me', { headers: authHeaders() }).then((r) => r.json()),
      fetch(`/api/users/${userId}/posts`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([albumsData, postsData]) => {
        if (!active) return;
        setMyAlbums(albumsData.success ? albumsData.albums : []);
        setMyPosts(postsData.success ? postsData.posts : []);
      })
      .catch((err) => console.error('Failed to load your albums/posts:', err))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 text-left">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {[['post', 'New post'], ['album', 'New album']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setSearchParams({ type: key })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                type === key ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : type === 'post' ? (
            <CreatePostForm myAlbums={myAlbums} preselectedAlbumId={preselectedAlbumId} />
          ) : (
            <CreateAlbumForm myPosts={myPosts} />
          )}
        </section>
      </main>
    </div>
  );
}

export default CreatePage;
