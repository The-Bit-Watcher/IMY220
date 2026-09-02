import React from 'react';
import { Image as BsImage } from 'react-bootstrap';

function PostImage({ src, alt = "Post image", className = "", onClick }) {
  if (!src) return null;

  return (
    <div 
      className={`post-image-container overflow-hidden bg-dark text-center rounded ${className}`} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', maxHeight: '500px' }}
    >
      <BsImage
        src={src}
        alt={alt}
        fluid
        style={{ objectFit: 'contain', maxHeight: '500px', width: '100%' }}
      />
    </div>
  );
}

export default PostImage;