import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import Header from '../components/common/Header/Header';
import SearchBar from '../components/home/SearchInput';
import LocalFeed from '../components/home/LocalFeed';
import GlobalFeed from '../components/home/GlobalFeed';

function HomePage() {
  const rawUserData = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const storedUser = rawUserData.data || rawUserData;
  const currentUserId = storedUser.userId || storedUser._id;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('local');

  const [sortBy, setSortBy] = useState("newest"); // newest || comments
  const [searchParams] = useSearchParams();
  const [hashtagFilter, setHashtagFilter] = useState(searchParams.get("tag") || "");
  const [timeframe, setTimeframe] = useState("all"); // all || week || month

  const filterOptions = useMemo(() => ({
    sortBy,
    hashtagFilter,
    timeframe,
    searchTerm
  }), [sortBy, hashtagFilter, timeframe, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans"> 
      <Header currentUserId={currentUserId} />

      <main className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          <div className="space-y-3">
            {/* Tab Controls */}
            <div className="flex border-b border-slate-800 pb-2 gap-2">            
              <button
                onClick={() => setActiveTab('local')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "local" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Friends & Favorites
              </button>
              <button
                onClick={() => setActiveTab('global')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "global" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Global Feed
              </button>
            </div>

            {/* Sorting & Filtering Controls */}
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="comments">Sort: Most Commented</option>
              </select>

              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Time: All Time</option>
                <option value="week">Time: Past Week</option>
                <option value="month">Time: Past Month</option>
              </select>

              <input
                type="text"
                placeholder="Filter by #tag"
                value={hashtagFilter}
                onChange={(e) => setHashtagFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />                
            </div>
          </div>

          {/* Active Feed Render */}
          {activeTab === "local" ? (
            <LocalFeed currentUserId={currentUserId} filterOptions={filterOptions} />
          ) : (
            <GlobalFeed filterOptions={filterOptions} />
          )}
        </div>

        {/* Sidebar Info */}
        <div className="hidden md:block space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-slate-200 text-sm mb-2">Feed Insights</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Viewing <strong>{activeTab === "local" ? "Friends & Favorites" : "Global"}</strong> feed sorted by{" "}
              <strong>{sortBy}</strong>. Posts with high reports (&gt;2) are automatically hidden for safety.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;