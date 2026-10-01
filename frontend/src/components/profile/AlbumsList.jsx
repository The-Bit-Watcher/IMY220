import React from 'react';
import { useNavigate } from 'react-router-dom';

// Album cover: 1 image fills the box, 2-4 images become a collage
function AlbumCover({ images, title }) {
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs">Empty album</span>
      </div>
    );
  }

  if (images.length === 1) {
    return <img src={images[0]} alt={title} loading="lazy" className="w-full h-full object-cover" />;
  }

  return (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5">
      {images.slice(0, 4).map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className={`w-full h-full object-cover ${images.length === 3 && i === 0 ? 'row-span-2' : ''}`}
        />
      ))}
    </div>
  );
}

function AlbumsList({ albums = [], emptyText = "No albums created yet." }) {
  const navigate = useNavigate();
  if (albums.length === 0) {
    return <div className="text-slate-500 text-center py-6 text-sm">{emptyText}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {albums.map((album) => (
        <button
          key={album._id}
          type="button"
          onClick={() => navigate(`/album/${album._id}`)}
          className="text-left bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-xl overflow-hidden transition-colors"
        >
          <div className="h-40 bg-slate-950 overflow-hidden">
            <AlbumCover images={album.coverImages} title={album.title} />
          </div>
          <div className="p-3 space-y-1">
            <h4 className="font-bold text-slate-200 text-sm truncate">{album.title}</h4>
            {album.description && (
              <p className="text-xs text-slate-400 line-clamp-2">{album.description}</p>
            )}
            <p className="text-[11px] text-slate-500">
              {album.postCount} {album.postCount === 1 ? 'photo' : 'photos'}
            </p>
            {album.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {album.hashtags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default AlbumsList;
