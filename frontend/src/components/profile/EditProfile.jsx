import { useState, useRef } from 'react';
import Modal from '../common/Modal';
import ErrorBox from '../common/ErrorBox';
import { AvatarDisplay } from '../../utils/avatarGenerator';
import { resizeImage } from '../../utils/image';
import { getStoredUser, updateStoredUser } from '../../utils/session';
import { api } from '../../services/api';

// Edit a profile. Used for your own profile, and by admins for any account (adminMode adds email, role and password).
function EditProfile({ user, onHide, onUpdated, adminMode = false }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    role: user?.role || 'user',
    verified: !!user?.verified,
    password: '',
  });
  const [socialLinks, setSocialLinks] = useState({
    twitter: user?.socialLinks?.twitter || '',
    github: user?.socialLinks?.github || '',
    website: user?.socialLinks?.website || '',
  });
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const processImageFile = async (file) => {
    try {
      setProfileImage(await resizeImage(file, 400));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(form.username.trim())) return 'Username must be 3-30 characters: letters, numbers, _ or .';
    if (adminMode && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email address.';
    if (adminMode && form.password && form.password.length < 6) return 'New password must be at least 6 characters.';
    if (socialLinks.website && !/^https?:\/\/\S+\.\S+/.test(socialLinks.website)) return 'Website must start with http:// or https://';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    setIsSubmitting(true);
    setError('');
    const body = {
      name: form.name.trim(),
      username: form.username.trim(),
      bio: form.bio,
      location: form.location.trim(),
      socialLinks,
      profileImage,
      ...(adminMode ? { email: form.email.trim(), role: form.role, verified: form.verified, ...(form.password ? { password: form.password } : {}) } : {}),
    };

    try {
      const data = adminMode
        ? await api(`/api/admin/users/${user._id}`, { method: 'PUT', body })
        : await api('/api/profile/me', { method: 'PUT', body });
      const updated = adminMode ? data.user : data.data;

      // Keep the header avatar/name in sync when editing yourself
      if (String(updated._id) === String(getStoredUser().userId)) {
        updateStoredUser({ name: updated.name, username: updated.username, profileImage: updated.profileImage });
      }
      onUpdated(updated);
      onHide();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={adminMode ? `Edit @${user.username} (admin)` : 'Edit profile'} onClose={onHide} busy={isSubmitting} size="xl">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-5">
          <ErrorBox message={error} />

          {/* Profile image */}
          <div className="space-y-2">
            <label htmlFor="profile-image-input" className="field-label">Profile picture</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <AvatarDisplay username={form.name || form.username} src={profileImage} className="w-20 h-20 text-xl shrink-0" />
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); processImageFile(e.dataTransfer.files[0]); }}
                className={`flex-1 w-full p-4 border-2 border-dashed rounded-xl text-center transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950'
                }`}
              >
                <p className="text-xs text-slate-400 mb-2">Drag &amp; drop a picture here, or</p>
                <input id="profile-image-input" ref={fileInputRef} type="file" accept="image/*"
                  onChange={(e) => processImageFile(e.target.files[0])} className="sr-only" />
                <div className="flex gap-2 justify-center">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">Browse files</button>
                  {profileImage && (
                    <button type="button" onClick={() => setProfileImage('')} className="btn btn-ghost-danger">Remove</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-name" className="field-label">Full name</label>
              <input id="profile-name" type="text" value={form.name} onChange={setField('name')} className="field-input" maxLength={60} />
            </div>
            <div>
              <label htmlFor="profile-username" className="field-label">Username</label>
              <input id="profile-username" type="text" value={form.username} onChange={setField('username')} className="field-input" maxLength={30} />
            </div>
          </div>

          {adminMode && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="md:col-span-1">
                <label htmlFor="profile-email" className="field-label">Email</label>
                <input id="profile-email" type="email" value={form.email} onChange={setField('email')} className="field-input" />
              </div>
              <div>
                <label htmlFor="profile-role" className="field-label">Role</label>
                <select id="profile-role" value={form.role} onChange={setField('role')} className="field-input">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="profile-password" className="field-label">New password (optional)</label>
                <input id="profile-password" type="text" autoComplete="off" value={form.password} onChange={setField('password')}
                  placeholder="Leave blank to keep" className="field-input" />
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <input id="profile-verified" type="checkbox" checked={form.verified}
                  onChange={(e) => setForm((prev) => ({ ...prev, verified: e.target.checked }))} className="w-4 h-4 accent-indigo-500" />
                <label htmlFor="profile-verified" className="text-xs text-slate-300">Verified account (shows the blue check)</label>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="profile-location" className="field-label">Location</label>
            <input id="profile-location" type="text" placeholder="City, Country" value={form.location} onChange={setField('location')} className="field-input" maxLength={80} />
          </div>

          <div>
            <div className="flex justify-between">
              <label htmlFor="profile-bio" className="field-label">Short bio</label>
              <span className="text-[10px] text-slate-500">{250 - form.bio.length} characters left</span>
            </div>
            <textarea id="profile-bio" rows={3} placeholder="Tell everyone a bit about yourself..." value={form.bio}
              onChange={setField('bio')} maxLength={250} className="field-input resize-none" />
          </div>

          <fieldset className="pt-2 border-t border-slate-800">
            <legend className="field-label pt-3">Social links</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ['twitter', 'X / Twitter handle', '@handle'],
                ['github', 'GitHub username', 'username'],
                ['website', 'Website', 'https://your-site.com'],
              ].map(([key, label, placeholder]) => (
                <div key={key}>
                  <label htmlFor={`social-${key}`} className="block text-[11px] text-slate-400 mb-1">{label}</label>
                  <input id={`social-${key}`} type="text" placeholder={placeholder} value={socialLinks[key]}
                    onChange={(e) => setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))} className="field-input !text-xs" />
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-950/50 border-t border-slate-800">
          <button type="button" onClick={onHide} disabled={isSubmitting} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default EditProfile;
