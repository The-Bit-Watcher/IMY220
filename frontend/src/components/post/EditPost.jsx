import React, { useState } from 'react';

function EditPost({ show, onHide, post, onSave }) {
  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(
    Array.isArray(post?.hashtags) ? post.hashtags.join(' ') : post?.hashtags || ''
  );

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedTags = hashtags
      .split(' ')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

    onSave({
      ...post,
      caption,
      hashtags: formattedTags
    });
    onHide();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-body">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-bold font-heading text-slate-100">
            Edit Post
          </h2>
          <button
            type="button"
            onClick={onHide}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description / Caption
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Hashtags
            </label>
            <input
              type="text"
              placeholder="#react #javascript #webdev"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <p className="mt-1 text-xs text-slate-500">
              Separate hashtags with spaces.
            </p>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs text-slate-400">
            Note: Post media images cannot be changed after publication.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onHide}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPost;