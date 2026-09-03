import React, { useState, useEffect } from 'react';

function EditProfile({ show, onHide, userId, users = [], onProfileUpdated }){
  const currentUser = users.find(u => u.id === userId);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when props change
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setProfileImage(currentUser.profileImage || '');
    }
  }, [userId, show, currentUser]);

  if (!show) return null;

  const processImageFile = (file) => {
    if (file && file.type.startsWith('image/')){
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setError("Name and username are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const userIndex = users.findIndex(user => user.id === userId);

      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          name,
          username,
          bio,
          location,
          profileImage,
        };
        
        if (onProfileUpdated) {
          onProfileUpdated(users[userIndex]);
        }
        onHide();
      } else {
        throw new Error('User not found');
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Edit Profile</h3>
          <button onClick={onHide} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {error && <div className="bg-red-50 text-red-600 border border-red-200 p-2 text-sm rounded">{error}</div>}

            {/* Profile Image Section */}
            <div className="text-center">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image</label>
              <div className="flex justify-center mb-3">
                <img
                  src={profileImage || 'https://via.placeholder.com/120'}
                  alt="Profile Preview"
                  className="w-28 h-28 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-4 border-2 border-dashed rounded text-center ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <p className="text-xs text-gray-500 mb-2">
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
                  className="px-3 py-1 bg-white border border-blue-600 text-blue-600 rounded text-xs hover:bg-blue-50"
                  onClick={() => document.getElementById('profileImageUpload').click()}
                >
                  Browse File
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="City, Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Short Bio</label>
              <textarea
                rows={3}
                placeholder="Tell everyone a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={250}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">{250 - bio.length} characters remaining.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 bg-gray-50 border-t">
            <button 
              type="button" 
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100" 
              onClick={onHide} 
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50" 
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