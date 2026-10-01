import React from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
      // Blacklists the token in Redis so it can't be reused even before it expires
      if (token) {
        await fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all"
    >
      Log Out
    </button>
  );
}

export default Logout;
