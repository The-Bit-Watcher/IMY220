import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logout from '../Logout/LogOut';
import { AvatarDisplay } from '../../../utils/avatarGenerator';
import { getStoredUser } from '../../../utils/session';

function Header() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Retrieve user from localStorage, and refresh when the profile is edited
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  useEffect(() => {
    const refresh = () => setCurrentUser(getStoredUser());
    window.addEventListener('currentUserUpdated', refresh);
    return () => window.removeEventListener('currentUserUpdated', refresh);
  }, []);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div 
            onClick={() => navigate('/home')}
            className="cursor-pointer font-heading font-extrabold text-xl text-slate-100 hover:text-indigo-400 transition-colors"
          >
            LifeSocialCapture
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/home" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
            <NavLink to="/create" className={linkClass}>
              + Create
            </NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <AvatarDisplay 
                username={currentUser?.username || currentUser?.name || 'User'} 
                src={currentUser?.profileImage} 
                className="w-8 h-8"
              />
              <span className="text-xs font-semibold text-slate-200">
                {currentUser?.name || currentUser?.username || 'Profile'}
              </span>
            </div>
            <Logout />
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white focus:outline-none p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-3">
          <NavLink to="/home" className={(s) => `block ${linkClass(s)}`}>Home</NavLink>
          <NavLink to="/profile" className={(s) => `block ${linkClass(s)}`}>Profile</NavLink>
          <NavLink to="/create" className={(s) => `block ${linkClass(s)}`}>+ Create</NavLink>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <AvatarDisplay 
                username={currentUser?.username || currentUser?.name || 'User'} 
                src={currentUser?.profileImage} 
                className="w-8 h-8"
              />
              <span className="text-xs font-semibold text-slate-200">
                {currentUser?.name || currentUser?.username || 'Profile'}
              </span>
            </div>
            <Logout />
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;