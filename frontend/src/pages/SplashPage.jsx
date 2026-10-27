import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/splash/LoginForm';
import SignUpForm from '../components/splash/SignUpForm';
import './SplashPage.css';

const FEATURES = [
  { title: 'Share photos', text: 'Post images with captions and hashtags in seconds.' },
  { title: 'Organise albums', text: 'Group your favourite shots, yours or your friends’, into albums.' },
  { title: 'Friends & favourites', text: 'A local feed of the people you actually care about.' },
];

function SplashPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  // Already logged in? Skip the splash.
  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/home', { replace: true });
  }, [navigate]);

  return (
    <div className="splash min-h-screen bg-slate-950 text-slate-100 text-left">
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Hero */}
        <section className="space-y-6">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Welcome to LifeSocialCapture
          </span>
          <h1 className="splash-hero-title">Connect. Share. Build together.</h1>
          <p className="text-slate-400 text-base max-w-md">
            A community platform for sharing images with the people who matter.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold"
            >
              Join the community
            </button>
            <a href="#features" className="px-5 py-2.5 border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-semibold text-slate-200">
              Explore features
            </a>
          </div>
        </section>

        {/* Auth card */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-2 border-b border-slate-800" role="tablist">
            {[
              ['login', 'Log In'],
              ['signup', 'Sign Up'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`py-3 text-sm font-semibold transition-colors ${
                  activeTab === key ? 'text-white bg-slate-800/70 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'login' ? <LoginForm /> : <SignUpForm />}

            <p className="mt-4 text-xs text-slate-500 text-center">
              {activeTab === 'login' ? (
                <>No account yet?{' '}
                  <button type="button" onClick={() => setActiveTab('signup')} className="text-indigo-400 hover:underline">Sign up</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => setActiveTab('login')} className="text-indigo-400 hover:underline">Log in</button>
                </>
              )}
            </p>
          </div>
        </section>
      </main>

      <section id="features" className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-100 mb-1">{f.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © LifeSocialCapture. All rights reserved.
      </footer>
    </div>
  );
}

export default SplashPage;
