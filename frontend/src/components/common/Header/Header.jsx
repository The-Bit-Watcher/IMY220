import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logout from '../Logout/LogOut';
import SearchBox from '../SearchBox';
import ThemeToggle from '../ThemeToggle';
import { AvatarDisplay } from '../../../utils/avatarGenerator';
import { getStoredUser } from '../../../utils/session';

// Only rendered on logged-in pages, so Log Out is never shown to a logged-out visitor
function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(getStoredUser);

  // Re-read the user when the profile is edited
  useEffect(() => {
    const refresh = () => setCurrentUser(getStoredUser());
    window.addEventListener('currentUserUpdated', refresh);
    return () => window.removeEventListener('currentUserUpdated', refresh);
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const displayName = currentUser?.name || currentUser?.username || 'Profile';

  const links = [
    ['/home', 'Home'],
    ['/profile', 'Profile'],
    ['/create', '+ Create'],
    ...(isAdmin ? [['/admin', 'Admin']] : []),
  ];

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-slate-50'}`;

  const close = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link to="/home" className="font-heading font-extrabold text-lg sm:text-xl text-slate-100 hover:text-indigo-400 transition-colors shrink-0">
            LifeSocialCapture
          </Link>

          <SearchBox className="hidden md:block flex-1 max-w-sm" />

          <nav aria-label="Main" className="hidden lg:flex items-center gap-5">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/profile'} className={linkClass}>{label}</NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/profile" className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors">
              <AvatarDisplay username={displayName} src={currentUser?.profileImage} className="w-8 h-8 text-xs" />
              <span className="text-xs font-semibold text-slate-200 max-w-[8rem] truncate">{displayName}</span>
            </Link>
            <ThemeToggle />
            <Logout />
          </div>

          <ThemeToggle className="lg:hidden ml-auto" />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden text-slate-400 hover:text-slate-50 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-menu" className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-3">
          <SearchBox className="md:hidden" onNavigate={close} />
          <nav aria-label="Mobile" className="space-y-3">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/profile'} onClick={close} className={(s) => `block ${linkClass(s)}`}>{label}</NavLink>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <Link to="/profile" onClick={close} className="flex items-center gap-2">
              <AvatarDisplay username={displayName} src={currentUser?.profileImage} className="w-8 h-8 text-xs" />
              <span className="text-xs font-semibold text-slate-200">{displayName}</span>
            </Link>
            <Logout />
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
