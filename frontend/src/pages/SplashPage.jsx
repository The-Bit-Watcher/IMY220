import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SplashPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Real Backend Login Request
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all fields.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid login credentials.');
      }
      const token = data.data?.token || data.token;
      // Save user session and token
      if (token) {
        localStorage.setItem('token', token);
      }
      localStorage.setItem('currentUser', JSON.stringify(data.user || data || data.data));

      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Server connection failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Real Backend Sign Up Request
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setSignUpError('');
    setSignUpSuccess('');

    const nameToSend = signUpName.trim() !== '' ? signUpName : signUpUsername;

    if (!signUpUsername || !signUpEmail || !signUpPassword) {
      setSignUpError('All required fields must be filled.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match.');
      return;
    }

    setIsSigningUp(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: signUpUsername,
          name: signUpName,
          email: signUpEmail,
          password: signUpPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSignUpSuccess('Account created successfully! Auto-logging you in...');
      const token = data.data?.token || data.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      localStorage.setItem('currentUser', JSON.stringify(data.user || data || data.data));

      setTimeout(() => {
        navigate('/home');
      }, 1200);
    } catch (err) {
      console.error('Sign up error:', err);
      setSignUpError(err.message || 'Server error during registration.');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div>
      <div>
        <div>
          <div>
            <span>Welcome to LifeSocialCapture</span>
            <h1>Connect. Share. Build Together.</h1>
            <p>A community platform for sharing images.</p>
            <div className="flex flex-wrap gap-4">
              <a href="#features">Explore Features</a>
              <button onClick={() => setActiveTab('signup')}>
                Join Community
              </button>
            </div>
          </div>

          <div>
            <div>
              <div>
                <button onClick={() => setActiveTab('login')}>Log In</button>
                <button onClick={() => setActiveTab('signup')}>Sign Up</button>
              </div>

              <div className="p-6">
                {activeTab === 'login' && (
                  <form onSubmit={handleLoginSubmit}>
                    <h4>Welcome Back</h4>
                    {loginError && <div className="text-red-500">{loginError}</div>}

                    <div>
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="xx@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="*****"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" disabled={isLoggingIn}>
                      {isLoggingIn ? 'Logging in...' : 'Log In'}
                    </button>
                  </form>
                )}

                {activeTab === 'signup' && (
                  <form onSubmit={handleSignUpSubmit} className="space-y-3">
                    <h4>Create Account</h4>
                    {signUpError && <div className="text-red-500">{signUpError}</div>}
                    {signUpSuccess && <div className="text-green-500">{signUpSuccess}</div>}

                    <div>
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="Peter John"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
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

                    <button type="submit" disabled={isSigningUp}>
                      {isSigningUp ? 'Creating Account...' : 'Register Account'}
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