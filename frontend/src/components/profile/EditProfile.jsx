import React, { useState } from 'react';

function EditProfile({ user, show, onHide, onUpdated }) {
  // Initialize state directly from user prop
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [socialLinks, setSocialLinks] = useState(user?.socialLinks || { twitter: "", github: "", website: "" });

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!show) return null;

  const processImageFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setError('Please upload an image file (PNG, JPG, SVG).');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processImageFile(file);
  };

  const handleSocialChange = (field, value) => {
    setSocialLinks((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setError("Name and username are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name, username, bio, location, socialLinks, profileImage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        onUpdated();
        onHide();
      } else {
        setError(data.message || "Failed to save changes.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-100">Edit Profile</h3>
          <button 
            onClick={onHide} 
            className="text-slate-400 hover:text-slate-200 text-2xl font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 text-xs rounded-lg">
                {error}
              </div>
            )}

            {/* Profile Image Preview & Drag and Drop */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Profile Image</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={profileImage || 'https://via.placeholder.com/120'}
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-700 shadow-md flex-shrink-0"
                />
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 w-full p-4 border-2 border-dashed rounded-xl text-center transition-all ${
                    isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  <p className="text-xs text-slate-400 mb-2">
                    Drag & drop a new profile picture here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="profileImageUpload"
                  />
                  <button
                    type="button"
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-all"
                    onClick={() => document.getElementById('profileImageUpload').click()}
                  >
                    Browse File
                  </button>
                </div>
              </div>
            </div>

            {/* Identity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
              <input
                type="text"
                placeholder="City, Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Bio */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Short Bio</label>
                <span className="text-[10px] text-slate-500">{250 - bio.length} characters left</span>
              </div>
              <textarea
                rows={3}
                placeholder="Tell everyone a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={250}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">Social Links</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Twitter Handle"
                  value={socialLinks.twitter || ''}
                  onChange={(e) => handleSocialChange('twitter', e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="GitHub Username"
                  value={socialLinks.github || ''}
                  onChange={(e) => handleSocialChange('github', e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Website URL"
                  value={socialLinks.website || ''}
                  onChange={(e) => handleSocialChange('website', e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-slate-950/50 border-t border-slate-800">
            <button 
              type="button" 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50" 
              onClick={onHide} 
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50" 
              disabled={isSubmitting}
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