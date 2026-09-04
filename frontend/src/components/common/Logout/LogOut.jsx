import React from 'react';
import { useNavigate } from 'react-router-dom';

function Logout({ variant = "secondary" }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
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