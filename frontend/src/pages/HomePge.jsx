import React, { useState, useEffect } from 'react';

import Header from '../components/common/Header/Header';
import SearchBar from '../components/home/SearchInput';
import LocalFeed from '../components/home/LocalFeed';
import GlobalFeed from '../components/home/GlobalFeed';
import ProfilePreview from '../components/common/ProfilePreview/ProfilePreview';

function HomePage({ currentUserId = 1 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('local');

  const [sortBy, setSortBy] = useState("newest"); //newest || comments
  const [hashtagFilter, setHashtagFilter] = useState("");
  const [timeframe, setTimeframe] = useState("all");//all || week || month

  const filterOptions = {
    sortBy, hashtagFilter, timeframe, searchTerm
  };

  
  return (
    <div>
      <Header currentUserId={currentUserId} />

      <main>
        <div>
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

        <div>
          <div>
            <div>
              <button
                onClick={() => setActiveTab('local')}>
                Friends & Favorites
              </button>
              <button
                onClick={() => setActiveTab('global')}>
                Global Feed
              </button>
            </div>

            {activeTab === 'local' ? (
              <LocalFeed currentUserId={currentUserId} searchTerm={searchTerm} />
            ) : (
              <GlobalFeed searchTerm={searchTerm} />
            )}
          </div>

          <div>
            <div>
              <div>
                <h2>
                  Recommended People
                </h2>
                <p >Connect with new developers</p>
              </div>

              <div>
                {recommendedUsers.length === 0 ? (
                  <p >No new recommendations right now!</p>
                ) : (
                  recommendedUsers.map(recommendedUser => (
                    <ProfilePreview 
                      key={recommendedUser.id} 
                      user={recommendedUser}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;