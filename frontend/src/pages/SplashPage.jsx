import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { users } from '../data/mockProfiles';

const getRandomAvatar = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

function SplashPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all fields.');
      return;
    }

    const foundUser = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());

    if (foundUser) {
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      navigate('/home');
    } else {
      localStorage.setItem('currentUser', JSON.stringify(users[0]));
      navigate('/home');
    }
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setSignUpError('');
    setSignUpSuccess('');

    if (!signUpUsername || !signUpName || !signUpEmail || !signUpPassword) {
      setSignUpError('All fields are required.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match.');
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === signUpEmail.toLowerCase());
    if (emailExists) {
      setSignUpError('An account with this email address already exists.');
      return;
    }

    const newUser = {
      id: Date.now(),
      username: signUpUsername,
      name: signUpName,
      email: signUpEmail,
      bio: "New developer community member.",
      profileImage: getRandomAvatar(signUpUsername),
      location: "Pretoria, South Africa",
      joinedDate: new Date().toISOString().split('T')[0],
      friendIds: [],
      favoriteIds: []
    };

    users.push(newUser);

    setSignUpSuccess('Account created successfully! Auto-logging you in...');
    setTimeout(() => {
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      navigate('/home');
    }, 1200);
  };

  return (
    <div>
      <div>
        <div >
          
          <div>
            <span>
              Welcome to LifeSocialCapture
            </span>
            <h1>
              Connect. Share. Build Together.
            </h1>
            <p>
              A community platform for sharing images.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="#features" >
                Explore Features
              </a>
              <button 
                onClick={() => setActiveTab('signup')}>
                Join Community
              </button>
            </div>
          </div>

          <div>
            <div>

              <div>
                <button
                  onClick={() => setActiveTab('login')}>
                  Log In
                </button>
                <button
                  onClick={() => setActiveTab('signup')}>
                  Sign Up
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'login' && (
                  <form onSubmit={handleLoginSubmit}>
                    <h4>Welcome Back</h4>
                    {loginError && (
                      <div>
                        {loginError}
                      </div>
                    )}

                    <div>
                      <label>
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="xx@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label>
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="*****"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit">
                      Log In
                    </button>

                    <p>
                      Tip: Use <span>shaun@example.com</span> to log in instantly.
                    </p>
                  </form>
                )}

                {activeTab === 'signup' && (
                  <form onSubmit={handleSignUpSubmit} className="space-y-3">
                    <h4>Create Account</h4>
                    {signUpError && (
                      <div>
                        {signUpError}
                      </div>
                    )}
                    {signUpSuccess && (
                      <div>
                        {signUpSuccess}
                      </div>
                    )}

                    <div>
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="Peter John"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        required

                      />
                    </div>

                    <div>
                      <label>Username</label>
                      <input
                        type="text"
                        placeholder="shaun_dev"
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="xxxx@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <div>
                        <label>Password</label>
                        <input
                          type="password"
                          placeholder="*****"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label>Confirm</label>
                        <input
                          type="password"
                          placeholder="*****"
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit">
                      Register Account
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <p>© LifeSocialCapture. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default SplashPage;