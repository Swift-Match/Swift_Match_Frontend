import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';

// countries...
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'BR', name: 'Brazil' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'AU', name: 'Australia' },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // ====== ADJUST THESE VALUES TO MOVE / RESIZE THE SIDE IMAGES ======
  const LEFT_IMG_SRC = '/Components/LeftRegisterWall.png';   // change if needed
  const RIGHT_IMG_SRC = '/Components/RightRegisterWall.png';
  const LEFT_IMG_WIDTH = '500px';
  const LEFT_IMG_HEIGHT = '92vh';
  const RIGHT_IMG_WIDTH = '500px';
  const RIGHT_IMG_HEIGHT = '92vh';
  const LEFT_IMG_OFFSET_X = -50;
  const LEFT_IMG_OFFSET_Y = 30;
  const RIGHT_IMG_OFFSET_X = -50;
  const RIGHT_IMG_OFFSET_Y = 30;
  // =================================================================

  // center container sizing (also adjustable)
  const CENTER_WIDTH = '520px';
  const CENTER_PADDING = 36;
  const OUTLINE_PADDING = 20;

  const CENTER_HEIGHT = '590px'; 
  const OUTLINE_HEIGHT = '520px'; 

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [country, setCountry] = useState<string>('BR');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    localStorage.removeItem('authToken');
    delete API.defaults.headers.common['Authorization'];
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const payload = { username, email, password, first_name: firstName, country };
    try {
      await API.post('/api/users/register/', payload);
      const loginRes = await API.post('/api/auth/token/', { username, password });
      const token = loginRes.data.access || loginRes.data.auth_token || loginRes.data.token;
      if (token) {
        localStorage.setItem('authToken', token);
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setMessage('Welcome! Proceeding to theme selection...');
        setTimeout(() => navigate('/theme-selection'), 2000);
      } else {
        setMessage('Registration completed! Please log in manually.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error('Registration error', err);
      setMessage('Registration failed. Check your data and try again.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        backgroundColor: '#171614',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',
        padding: 24,
      }}
    >
      {/* LEFT IMAGE */}
      <img
        src={LEFT_IMG_SRC}
        alt="left wall"
        style={{
          position: 'absolute',
          left: LEFT_IMG_OFFSET_X,
          top: LEFT_IMG_OFFSET_Y,
          width: LEFT_IMG_WIDTH,
          height: LEFT_IMG_HEIGHT,
          objectFit: 'contain',
          pointerEvents: 'none',
          zIndex: 1,
          transform: 'translateZ(0)',
        }}
        draggable={false}
      />

      {/* RIGHT IMAGE */}
      <img
        src={RIGHT_IMG_SRC}
        alt="right wall"
        style={{
          position: 'absolute',
          right: RIGHT_IMG_OFFSET_X,
          top: RIGHT_IMG_OFFSET_Y,
          width: RIGHT_IMG_WIDTH,
          height: RIGHT_IMG_HEIGHT,
          objectFit: 'contain',
          pointerEvents: 'none',
          zIndex: 1,
          transform: 'translateZ(0)',
        }}
        draggable={false}
      />

      {/* CENTER (sharp corners) */}
      <div
        style={{
          width: CENTER_WIDTH,
          maxWidth: 'calc(100% - 48px)',
          background: '#ffffff',
          height: CENTER_HEIGHT, 
          borderRadius: 0, // sharp corners
          padding: CENTER_PADDING,
          boxSizing: 'border-box',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          zIndex: 10,
        }}
      >
        {/* OUTLINE RECTANGLE (sharp corners) */}
        <div
          style={{
            border: '2px solid #000',
            padding: OUTLINE_PADDING,
            boxSizing: 'border-box',
            borderRadius: 0, // sharp corners
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            alignItems: 'stretch',
            background: 'transparent',
            height: OUTLINE_HEIGHT, 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/Components/ThemeSwiftMatch.svg" alt="logo" style={{ height: 52, objectFit: 'contain' }} />
          </div>

          <h2 style={{ margin: 0, textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#111827' }}>
            Sign up
          </h2>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#000' }}
            />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#000' }}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#000' }}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#000' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#000' }}
            />

            <button
              type="submit"
              style={{
                marginTop: 6,
                padding: '11px 14px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: '#000',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 15,
                transition: 'background-color 160ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ec4899';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#000';
              }}
            >
              Sign up
            </button>
          </form>

          {message && <p style={{ marginTop: 8, fontSize: 13, textAlign: 'center', color: '#F023CB' }}>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
