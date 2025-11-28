// src/pages/CatalogPage.tsx
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface CatalogPageProps {}

interface UserResult {
  id: number;
  username: string;
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
  { name: 'Grupos', svg: 'Groups.svg', path: '/updates' },
  { name: 'Analytics', svg: 'analytics.svg', path: '/analytics' },
  { name: 'Perfil', svg: 'profile.svg', path: '/my-profile' },
];

interface IconProps {
  svgName: string;
  color: string;
  size?: number;
}

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

const albumImageMap: Record<string, string> = {
  TS: 'TSFirstVersion.png',
  FEARLESS: 'FearlessFirstVersion.png',
  SPEAK_NOW: 'SpeakNowFirstVersion.png',
  RED: 'RedFirstVersion.png',
  '1989': '1989FirstVersion.png',
  REPUTATION: 'ReputationFirstVersion.png',
  LOVER: 'LoverFirstVersion.png',
  FOLKLORE: 'FolkloreFirstVersion.png',
  EVERMORE: 'EvermoreFirstVersion.png',
  MIDNIGHTS: 'MidnightsFirstVersion.png',
  TTPD: 'TTPDFirstVersion.png',
  SHOWGIRL: 'ShowgirlFirstVersion.png',
  ALBUM: 'AlbumFirstVersion.png',
};

const albumSecondImageMap: Record<string, string> = {
  TS: 'TSSecondVersion.png',
  FEARLESS: 'FearlessSecondVersion.png',
  SPEAK_NOW: 'SpeakNowSecondVersion.png',
  RED: 'RedSecondVersion.png',
  '1989': '1989SecondVersion.png',
  REPUTATION: 'ReputationSecondVersion.png',
  LOVER: 'LoverSecondVersion.png',
  FOLKLORE: 'FolkloreSecondVersion.png',
  EVERMORE: 'EvermoreSecondVersion.png',
  MIDNIGHTS: 'MidnightsSecondVersion.png',
  TTPD: 'TTPDSecondVersion.png',
  SHOWGIRL: 'ShowgirlSecondVersion.png',
  ALBUM: 'AlbumsSecondVersion.png',
};

/* <-- MAPA DE ROTAS PARA OS ALBUNS (fornecidas por você) */
const albumRouteMap: Record<string, string> = {
  SPEAK_NOW: '/speak-now',
  FEARLESS: '/fearless',
  REPUTATION: '/reputation',
  TS: '/taylor-swift',
  '1989': '/1989',
  FOLKLORE: '/folklore',
  EVERMORE: '/evermore',
  LOVER: '/lover',
  SHOWGIRL: '/showgirl',
  RED: '/red',
  MIDNIGHTS: '/midnights',
  TTPD: '/ttpd',
  ALBUM: '/album-ranking'
  // ALBUM or others default handled below
};

const CatalogPage: React.FC<CatalogPageProps> = () => {
  const [userTheme, setUserTheme] = useState<ThemeKey>('TS');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [hoveredAlbum, setHoveredAlbum] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchUsers = useCallback(async (term: string) => {
    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }

    const API_URL = `${import.meta.env.VITE_API_URL}/api/social/users/search/?query=${term}`;
    const token = localStorage.getItem('authToken');

    if (!token) return;

    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: UserResult[] = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erro de conexão ao buscar usuários:', error);
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
      const API_URL = '${import.meta.env.VITE_API_URL}/api/users/me/current-theme/';
      const token = localStorage.getItem('authToken');

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const receivedTheme = data.tema as ThemeKey;

          if (receivedTheme && receivedTheme in themeColorMap) {
            setUserTheme(receivedTheme);
          }
        }
      } catch (error) {
        console.error('Erro de conexão ou parsing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTheme();
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
        }}
      >
        <p>Carregando tema...</p>
      </div>
    );
  }

  const colors = themeColorMap[userTheme];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: '150px',
          minHeight: '100vh',
          backgroundColor: colors.dark,
          padding: '20px 8px',
          boxShadow: '4px 0 8px rgba(0, 0, 0, 0.2)',
          color: colors.light,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* LOGO */}
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 140,
              height: 140,
              backgroundColor: colors.light,
              maskImage: `url(/Components/Logo.svg)`,
              WebkitMaskImage: `url(/Components/Logo.svg)`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
          />
        </div>

        {/* ÍCONES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1px 4px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: colors.light,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${colors.light}22`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ThemeIcon svgName={item.svg} color={colors.light} size={62} />
            </button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div
        style={{
          flexGrow: 1,
          backgroundColor: colors.light,
          padding: 32,
        }}
      >
        {/* SEARCH */}
        <div style={{ marginBottom: 40, position: 'relative', width: '98%', margin: '0 0 40px 0' }}>
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '10px 15px',
              borderRadius: 8,
              border: `none`,
              fontSize: 16,
              outline: 'none',
              boxShadow: 'none',
              backgroundColor: '#FFFFFF',
              color: colors.dark,
            }}
          />

          {searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#FFFFFF',
                border: `1px solid ${colors.dark}`,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                zIndex: 10,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    color: '#000000',
                    fontWeight: 500,
                  }}
                  onClick={() => handleResultClick(user.id)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}

          {searchTerm.length > 0 && searchResults.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                padding: '10px 15px',
                backgroundColor: '#FFFFFF',
                border: `1px solid ${colors.dark}`,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                color: '#000000',
                textAlign: 'center',
              }}
            >
              Nenhum usuário encontrado.
            </div>
          )}
        </div>

        <h1 style={{ color: colors.dark, textAlign: 'center', fontSize: 28, fontWeight: 500, marginBottom: 40 }}>
          Available Ranks
        </h1>

        {/* BOTÕES DO CATÁLOGO — tamanho dos botões NÃO alterado */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[
            'TS',
            'FEARLESS',
            'SPEAK_NOW',
            'RED',
            '1989',
            'REPUTATION',
            'LOVER',
            'FOLKLORE',
            'EVERMORE',
            'MIDNIGHTS',
            'TTPD',
            'SHOWGIRL',
            'ALBUM',
          ].map((album) => {
            const firstFile = albumImageMap[album] || 'AlbumFirstVersion.png';
            const secondFile = albumSecondImageMap[album] || 'AlbumsSecondVersion.png';

            const isHovered = hoveredAlbum === album;
            const imageUrl = isHovered ? `/RankSecondButtonVersion/${secondFile}` : `/RankFirstButtonVersion/${firstFile}`;

            // decide a rota (se não existir, volta pra /catalog)
            const route = albumRouteMap[album] || '/catalog';

            return (
              <button
                key={album}
                style={{
                  flex: '0 0 calc(33.333% - 8px)',
                  padding: 80,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#FFF9F9',
                  color: '#FFF9F9',
                  fontWeight: 600,

                  backgroundImage: `url(${imageUrl})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: isHovered ? '120%' : 'contain',
                  transition: 'background-size 180ms ease',
                }}
                aria-label={album}
                onMouseEnter={() => setHoveredAlbum(album)}
                onMouseLeave={() => setHoveredAlbum(null)}
                onFocus={() => setHoveredAlbum(album)}
                onBlur={() => setHoveredAlbum(null)}
                onClick={() => navigate(route)}
              >
                <span style={{ color: 'transparent' }}>{album}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
