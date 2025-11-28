import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface UpdatesPage {}

interface UserResult { id: number; username: string; }

interface FriendshipRequest {
  id: number;
  from_user: number;
  from_username: string;
  to_username: string;
  status: string;
  created_at: string;
}

const themeColorMap = {
  TS: { dark: '#0C1A0C', light: '#A9CBAA' },
  FEARLESS: { dark: '#1E151A', light: '#FDDAA6' },
  SPEAK_NOW: { dark: '#000000', light: '#D6BADC' },
  RED: { dark: '#72333C', light: '#C7B2A2' },
  '1989': { dark: '#034A62', light: '#D1F3FF' },
  REPUTATION: { dark: '#2A2628', light: '#CACACA' },
  LOVER: { dark: '#3D2D34', light: '#FBB3D1' },
  FOLKLORE: { dark: '#000000', light: '#D5D5D5' },
  EVERMORE: { dark: '#2E2327', light: '#E0C9AF' },
  MIDNIGHTS: { dark: '#1F2E43', light: '#E0EDFD' },
  TTPD: { dark: '#9E958B', light: '#EEEDEB' },
  SHOWGIRL: { dark: '#C44615', light: '#9CCBC3' },
};

type ThemeKey = keyof typeof themeColorMap;

const sidebarItems = [
  { name: 'Home', svg: 'home.svg', path: '/catalog' },
  { name: 'Grupos', svg: 'Groups.svg', path: '/groups' },
  { name: 'Analytics', svg: 'analytics.svg', path: '/analytics' },
  { name: 'Perfil', svg: 'profile.svg', path: '/my-profile' },
];

interface IconProps { svgName: string; color: string; size?: number; }

const ThemeIcon: React.FC<IconProps> = ({ svgName, color, size = 24 }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      maskImage: `url(/Components/${svgName})`,
      WebkitMaskImage: `url(/Components/${svgName})`,
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
    }}
  />
);

const UpdatesPage: React.FC<UpdatesPage> = () => {
  const [userTheme, setUserTheme] = useState<ThemeKey>('TS');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendshipRequest[]>([]);

  const navigate = useNavigate();

  const fetchUsers = useCallback(async (term: string) => {
    if (term.trim() === '') { setSearchResults([]); return; }
    const base = (import.meta.env.VITE_API_URL as string) || '';
    const API_URL = `${base.replace(/\/+$/,'')}/api/social/users/search/?query=${encodeURIComponent(term)}`;
    const token = localStorage.getItem('authToken');
    console.log('[Updates] fetchUsers ->', API_URL, 'token?', !!token);
    if (!token) return;
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      console.log('[Updates] fetchUsers status', response.status);
      if (response.ok) {
        const data = await response.json().catch(() => []);
        setSearchResults(Array.isArray(data) ? data : (data?.results ?? []));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Erro de conexão ao buscar usuários:", error);
      setSearchResults([]);
    }
  }, []);


  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    fetchUsers(term);
  };

  const handleResultClick = (userId: number) => {
    navigate(`/profile/${userId}`);
    setSearchTerm('');
    setSearchResults([]);
  };

  useEffect(() => {
    const fetchUserTheme = async () => {
      const base = (import.meta.env.VITE_API_URL as string) || '';
      const API_URL = `${base.replace(/\/+$/,'')}/api/users/me/current-theme/`;
      const token = localStorage.getItem('authToken');
      console.log('[Updates] fetchUserTheme ->', API_URL, 'token?', !!token);
      if (!token) { setIsLoading(false); return; }
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        console.log('[Updates] fetchUserTheme status', response.status);
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          const receivedTheme = (data?.tema as ThemeKey) || (localStorage.getItem('userThemeKey') as ThemeKey) || 'TS';
          if (receivedTheme && receivedTheme in themeColorMap) setUserTheme(receivedTheme);
          else setUserTheme('TS');
        } else {
          console.warn('[Updates] fetchUserTheme non-ok body', await response.text().catch(()=>null));
        }
      } catch (error) {
        console.error("Erro de conexão ou parsing:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserTheme();
  }, []);


  const fetchFriendRequests = useCallback(async () => {
    const base = (import.meta.env.VITE_API_URL as string) || '';
    const API_URL = `${base.replace(/\/+$/,'')}/api/social/friendships/`;
    const token = localStorage.getItem('authToken');
    console.log('[Updates] fetchFriendRequests ->', API_URL, 'token?', !!token);
    if (!token) { setFriendRequests([]); return; }
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Updates] fetchFriendRequests status', response.status);
      if (response.ok) {
        const data = await response.json().catch(() => []);
        // normaliza formatos comuns: array direto ou { results: [] }
        const arr = Array.isArray(data) ? data : (data?.results ?? []);
        setFriendRequests(Array.isArray(arr) ? arr : []);
      } else {
        console.warn('[Updates] fetchFriendRequests non-ok body', await response.text().catch(()=>null));
        setFriendRequests([]);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos de amizade:", error);
      setFriendRequests([]);
    }
  }, []);

  useEffect(() => {
    fetchFriendRequests(); // primeira chamada imediata
    const iv = setInterval(() => { fetchFriendRequests(); }, 10000);
    return () => clearInterval(iv);
  }, [fetchFriendRequests]);

  const handleFriendRequestAction = async (requestId: number, action: 'accept' | 'reject') => {
    const base = (import.meta.env.VITE_API_URL as string) || '';
    const API_URL = `${base.replace(/\/+$/,'')}/api/social/friendships/${requestId}/${action}/`;
    const token = localStorage.getItem('authToken');
    console.log('[Updates] handleFriendRequestAction ->', API_URL, 'token?', !!token);
    if (!token) return;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Updates] handleFriendRequestAction status', response.status);
      if (response.ok) {
        // atualiza lista imediatamente
        await fetchFriendRequests();
      } else {
        console.error('[Updates] Erro ao processar ação do pedido, body:', await response.text().catch(()=>null));
      }
    } catch (error) {
      console.error('Erro ao processar ação do pedido:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
        <p>Carregando tema...</p>
      </div>
    );
  }

  const colors = themeColorMap[userTheme];

  return (
    // FORÇA a viewport inteira com width/height em vw/vh e evita contêineres pais limitando largura
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      {/* SIDEBAR (fixa 150px) */}
      <div style={{
        flex: '0 0 150px',
        width: 150,
        minHeight: '100vh',
        backgroundColor: colors.dark,
        padding: '20px 8px',
        boxShadow: '4px 0 8px rgba(0,0,0,0.2)',
        color: colors.light,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}>
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 140, height: 140, backgroundColor: colors.light,
            maskImage: `url(/Components/Logo.svg)`, WebkitMaskImage: `url(/Components/Logo.svg)`,
            maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center', WebkitMaskPosition: 'center'
          }}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          {sidebarItems.map(item => (
            <button key={item.name} onClick={() => navigate(item.path)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1px 4px', border: 'none', borderRadius: 4, cursor: 'pointer',
              backgroundColor: 'transparent', color: colors.light, transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${colors.light}22`)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <ThemeIcon svgName={item.svg} color={colors.light} size={62}/>
            </button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO — ocupa todo o espaço restante */}
      <div style={{
        flex: '1 1 auto',
        minWidth: 0,               // ESSENCIAL para conteúdo flex ocupar corretamente
        backgroundColor: colors.light,
        padding: 48,
        boxSizing: 'border-box',
        overflowY: 'auto',
        height: '100vh',
      }}>
        {/* SEARCH */}
        <div style={{ marginBottom: 40, position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%', padding: '10px 15px', borderRadius: 8, border: 'none', fontSize: 16, outline: 'none',
              backgroundColor: '#FFFFFF', color: colors.dark, boxSizing: 'border-box'
            }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF',
              border: `1px solid ${colors.dark}`, borderTop: 'none', borderRadius: '0 0 8px 8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: 30, maxHeight: 200, overflowY: 'auto'
            }}>
              {searchResults.map(user => (
                <div key={user.id}
                     style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#000', fontWeight: 500 }}
                     onClick={() => handleResultClick(user.id)}>
                  @{user.username}
                </div>
              ))}
            </div>
          )}
          {searchTerm.length > 0 && searchResults.length === 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, padding: '10px 15px',
              backgroundColor: '#FFFFFF', border: `1px solid ${colors.dark}`, borderTop: 'none',
              borderRadius: '0 0 8px 8px', color: '#000', textAlign: 'center'
            }}>
              Nenhum usuário encontrado.
            </div>
          )}
        </div>

        <h1 style={{ color: colors.dark, textAlign: 'center', fontSize: 28, fontWeight: 500, marginBottom: 40 }}>Updates</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {friendRequests.length === 0 ? (
            <div style={{ color: colors.dark, opacity: 0.7 }}>Nenhum pedido de amizade pendente.</div>
          ) : (
            friendRequests.map(req => (
              <div key={req.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#fff', borderRadius: 8, padding: '10px 15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <span style={{ color: colors.dark }}>
                  <span
                    style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => navigate(`/profile/${req.from_user}`)}
                  >
                    @{req.from_username}
                  </span> {' '}enviou um pedido de amizade
                </span>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleFriendRequestAction(req.id, 'accept')}
                    style={{ padding: '6px 12px', backgroundColor: 'green', color: '#fff', borderRadius: 4 }}
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleFriendRequestAction(req.id, 'reject')}
                    style={{ padding: '6px 12px', backgroundColor: 'red', color: '#fff', borderRadius: 4 }}
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatesPage;
