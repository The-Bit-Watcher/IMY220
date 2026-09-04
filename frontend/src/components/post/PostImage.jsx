import React from 'react';

function PostImage({ src, alt = "Post image", className = "", onClick }) {
  if (!src) return null;

  return (
    <div 
      className={`overflow-hidden bg-gray-900 rounded max-h-[500px] flex items-center justify-center ${className}`} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[500px] w-full object-contain"
      />
    </div>
  );
}

export default PostImage;