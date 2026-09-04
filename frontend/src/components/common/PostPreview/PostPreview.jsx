import React from 'react';

function PostPreview({ title, username, date, likes, img }) {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/10 hover:border-slate-700 transition-all duration-300 flex flex-col font-body">
      <div className="relative aspect-video overflow-hidden bg-slate-950">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading text-base font-bold text-slate-100 line-clamp-1 mb-1">
            {title}
          </h3>
          <p className="text-xs text-indigo-400 font-medium mb-3">
            @{username}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            {likes}
          </span>
          <span>{date}</span>
        </div>
      </div>
    </div>
  );
}

export default PostPreview;