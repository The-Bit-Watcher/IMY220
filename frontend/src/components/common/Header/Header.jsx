import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logout from '../Logout/LogOut';
import { users } from '../../../data/mockProfiles';

function Header({ currentUserId = 1 }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = users.find(u => u.id === currentUserId) || users[0];

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
            <NavLink to="/post/1" className={linkClass}>
              Sample Post
            </NavLink>
            <NavLink to={`/profile/${currentUser.id}`} className={linkClass}>
              Profile
            </NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div 
              onClick={() => navigate(`/profile/${currentUser.id}`)}
              className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <img 
                src={currentUser.profileImage} 
                alt={currentUser.name} 
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
              <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
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
          <NavLink to="/home" className={`block ${linkClass}`}>Home</NavLink>
          <NavLink to="/post/1" className={`block ${linkClass}`}>Sample Post</NavLink>
          <NavLink to={`/profile/${currentUser.id}`} className={`block ${linkClass}`}>Profile</NavLink>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div 
              onClick={() => navigate(`/profile/${currentUser.id}`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img 
                src={currentUser.profileImage} 
                alt={currentUser.name} 
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
              <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
            </div>
            <Logout />
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;