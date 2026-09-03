import React from "react";
import {Routes, Route} from 'react-router-dom';

import HomePage from '../pages/HomePge';
import PostPage from '../pages/PostPage';
import ProfilePage from '../pages/ProfilePage';
import SplashPage from '../pages/SplashPage';

function AppRoutes(){
    return (
        <Routes>
            <Route path="/" element={<SplashPage/>}/>
            <Route path="/home" element={<HomePage/>}/>
            <Route path="/post/:id" element={<PostPage/>}/>
            <Route path="/profile/:id" element={<ProfilePage/>}/>
            <Route path="*" element={<SplashPage/>}/>
        </Routes>
    )
}

export default AppRoutes;
