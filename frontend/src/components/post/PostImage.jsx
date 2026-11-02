
function PostImage({ src, alt = 'Post image', className = '' }) {
  if (!src) return null;
  return (
    <div className={`overflow-hidden bg-slate-950 max-h-[500px] flex items-center justify-center ${className}`}>
      <img src={src} alt={alt} className="max-h-[500px] w-full object-contain" />
    </div>
  );
}

export default PostImage;
