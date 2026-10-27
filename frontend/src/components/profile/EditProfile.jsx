import React, { useState, useRef, useEffect } from 'react';
import { AvatarDisplay } from '../../utils/avatarGenerator';
import { authHeaders, updateStoredUser } from '../../utils/session';

const MAX_IMAGE_SIDE = 400;       // px – profile pictures never need to be bigger
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Shrink the picked image with a canvas so we don't store multi-MB base64 strings in Mongo
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const inputClass =
  'w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500';

// Only mounted while open (ProfilePage renders it conditionally), so state always starts fresh from `user`
function EditProfile({ user, onHide, onUpdated }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [socialLinks, setSocialLinks] = useState({
    twitter: user?.socialLinks?.twitter || '',
    github: user?.socialLinks?.github || '',
    website: user?.socialLinks?.website || '',
  });
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !isSubmitting && onHide();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onHide, isSubmitting]);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, GIF, WEBP).');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Image is too large (max 8MB).');
      return;
    }
    try {
      setProfileImage(await resizeImage(file));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processImageFile(e.dataTransfer.files[0]);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.username.trim()) return 'Username is required.';
    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(form.username.trim()))
      return 'Username must be 3-30 characters: letters, numbers, _ or .';
    if (socialLinks.website && !/^https?:\/\/\S+\.\S+/.test(socialLinks.website))
      return 'Website must start with http:// or https://';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          bio: form.bio,
          location: form.location.trim(),
          socialLinks,
          profileImage,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Save failed (status ${response.status}).`);
      }

      // Keep the header avatar/name in sync without a reload
      updateStoredUser({
        name: data.data.name,
        username: data.data.username,
        profileImage: data.data.profileImage,
      });

      onUpdated(data.data);
      onHide();
    } catch (err) {
      console.error('Edit profile error:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && onHide()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-100">Edit Profile</h3>
          <button
            type="button"
            onClick={onHide}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-200 text-2xl font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 text-xs rounded-lg">{error}</div>
            )}

            {/* Profile image */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Profile Image</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <AvatarDisplay
                  username={form.name || form.username}
                  src={profileImage}
                  className="w-20 h-20 text-xl shrink-0"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex-1 w-full p-4 border-2 border-dashed rounded-xl text-center transition-all ${
                    isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  <p className="text-xs text-slate-400 mb-2">Drag & drop a new profile picture here, or</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => processImageFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs"
                    >
                      Browse File
                    </button>
                    {profileImage && (
                      <button
                        type="button"
                        onClick={() => setProfileImage('')}
                        className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={setField('name')} className={inputClass} maxLength={60} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input type="text" value={form.username} onChange={setField('username')} className={inputClass} maxLength={30} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
              <input type="text" placeholder="City, Country" value={form.location} onChange={setField('location')} className={inputClass} maxLength={80} />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Short Bio</label>
                <span className="text-[10px] text-slate-500">{250 - form.bio.length} characters left</span>
              </div>
              <textarea
                rows={3}
                placeholder="Tell everyone a bit about yourself..."
                value={form.bio}
                onChange={setField('bio')}
                maxLength={250}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Social links */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">Social Links</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  ['twitter', 'Twitter handle'],
                  ['github', 'GitHub username'],
                  ['website', 'https://your-site.com'],
                ].map(([key, placeholder]) => (
                  <input
                    key={key}
                    type="text"
                    placeholder={placeholder}
                    value={socialLinks[key]}
                    onChange={(e) => setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                    className={inputClass}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-slate-950/50 border-t border-slate-800">
            <button
              type="button"
              onClick={onHide}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
