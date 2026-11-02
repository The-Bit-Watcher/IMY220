import { Routes, Route, Navigate } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import PostPage from '../pages/PostPage';
import ProfilePage from '../pages/ProfilePage';
import SplashPage from '../pages/SplashPage';
import CreatePage from '../pages/CreatePage';
import AlbumPage from '../pages/AlbumPage';
import SearchPage from '../pages/SearchPage';
import AdminPage from '../pages/AdminPage';
import { GuestOnly, RequireAdmin, RequireAuth, SessionWatcher } from './RouteGuards';
import { isLoggedIn } from '../utils/session';

function AppRoutes() {
  return (
    <>
      <SessionWatcher />
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/" element={<SplashPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to={isLoggedIn() ? '/home' : '/'} replace />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
