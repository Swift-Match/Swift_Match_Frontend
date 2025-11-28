import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState<string>(''); 
    const [password, setPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        const loginPayload = { username, password };
        const loginEndpoint = '/api/auth/token/'; 
        const firstLoginCheckEndpoint = '/api/users/me/first-login/'; 

        try {
            const loginResponse = await API.post(loginEndpoint, loginPayload);
            const token = loginResponse.data.access || loginResponse.data.auth_token || loginResponse.data.token;
            
            if (!token) {
                setMessage("Success on login, but no token received. Check backend.");
                return;
            }

            localStorage.setItem('authToken', token);
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
            
            const firstLoginResponse = await API.get(firstLoginCheckEndpoint);
            const isFirstLogin = firstLoginResponse.data.first_login;

            let redirectPath = '/catalog';
            if (isFirstLogin) {
                redirectPath = '/theme-selection';
                setMessage("Welcome! It's time to choose your theme...");
            } else {
                setMessage("Just a moment...");
            }
            
            setTimeout(() => navigate(redirectPath), 1500);

        } catch (error: any) {
            let errorMessage = "Communication error or invalid credentials.";
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (status === 401) {
                    errorMessage = `Access denied (401). Check if your token is Bearer or expired.`;
                } else if (status === 404) {
                    errorMessage = `Error 404: Check if the route is correct in Django.`;
                } else if (status === 400) {
                    if (data.non_field_errors) {
                        errorMessage = `Credentials error: ${data.non_field_errors[0]}`;
                    } else {
                        errorMessage = "Invalid credentials.";
                    }
                } else if (data.detail) {
                    errorMessage = data.detail;
                }
            } else if (error.request) {
                errorMessage = "Network error.";
            }
            
            setMessage(errorMessage);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', alignItems: 'stretch', width: '100vw', position: 'relative' }}>

            {/* LOGO */}
            <img
                src="/Components/ThemeSwiftMatch.svg"
                alt="SwiftMatch Logo"
                style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    height: 50,
                    objectFit: 'contain',
                }}
            />

          <div style={{
            width: '460px',
            maxWidth: '46%',
            minWidth: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              padding: '36px 28px',
              fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            }}>
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 24, fontWeight: 700, color: '#111827', textAlign: 'left' }}>
                Let's start Matching!
              </h2>
              <p style={{ marginTop: 6, marginBottom: 18, color: '#6B7280', fontSize: 14 }}>
                Enter your username and password to continue.
              </p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    outline: 'none',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    color: '#000'
                  }}
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    outline: 'none',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    color: '#000'
                  }}
                />

                <button
                  type="submit"
                  style={{
                    marginTop: 6,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#000',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 15,
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ec4899';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#000';
                  }}
                >
                  Login
                </button>
              </form>

              {message && (
                <p style={{
                  marginTop: 14,
                  fontSize: 13,
                  textAlign: 'left',
                  color: '#F023CB'
                }}>
                  {message}
                </p>
              )}

              <div style={{ marginTop: 18, fontSize: 13, color: '#6B7280', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>Don't have an account?</span>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  style={{ background: 'transparent', border: 'none', color: '#ec4899', cursor: 'pointer', fontWeight: 600 }}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          <div
            role="img"
            aria-label="Eras wall"
            style={{
              flex: 1,
              minWidth: 0,
              backgroundImage: `url('/Components/ErasLoginWall.png')`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100vh'
            }}
            className="right-image-column"
          />
        </div>
    );
};

export default LoginPage;
