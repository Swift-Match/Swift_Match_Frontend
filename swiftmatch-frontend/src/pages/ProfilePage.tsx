// src/pages/ProfilePage.tsx
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface UserResult { id: number; username: string; }
interface UserProfile {
  id?: number;
  username?: string;
  first_name?: string | null;
  profile_picture_url?: string | null;
  profile_picture?: string | null;
  profile_photo?: string | null;
  cover_picture_url?: string | null;
  cover_url?: string | null;
  cover_image?: string | null;
  friends_count?: number;
  groups_count?: number;
  tema?: string | null;
  [key: string]: any;
}

interface FriendshipRequest { id: number; from_user: number; from_username: string; to_username: string; status: string; created_at: string; }

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
} as const;
type ThemeKey = keyof typeof themeColorMap;

const albumImageMap: Record<string, string> = {
  TS: 'TSFirstVersion.png', FEARLESS: 'FearlessFirstVersion.png', SPEAK_NOW: 'SpeakNowFirstVersion.png',
  RED: 'RedFirstVersion.png', '1989': '1989FirstVersion.png', REPUTATION: 'ReputationFirstVersion.png',
  LOVER: 'LoverFirstVersion.png', FOLKLORE: 'FolkloreFirstVersion.png', EVERMORE: 'EvermoreFirstVersion.png',
  MIDNIGHTS: 'MidnightsFirstVersion.png', TTPD: 'TTPDFirstVersion.png', SHOWGIRL: 'ShowgirlFirstVersion.png',
  ALBUM: 'AlbumFirstVersion.png',
};
const albumSecondImageMap: Record<string, string> = {
  TS: 'TSSecondVersion.png', FEARLESS: 'FearlessSecondVersion.png', SPEAK_NOW: 'SpeakNowSecondVersion.png',
  RED: 'RedSecondVersion.png', '1989': '1989SecondVersion.png', REPUTATION: 'ReputationSecondVersion.png',
  LOVER: 'LoverSecondVersion.png', FOLKLORE: 'FolkloreSecondVersion.png', EVERMORE: 'EvermoreSecondVersion.png',
  MIDNIGHTS: 'MidnightsSecondVersion.png', TTPD: 'TTPDSecondVersion.png', SHOWGIRL: 'ShowgirlSecondVersion.png',
  ALBUM: 'AlbumsSecondVersion.png',
};
const albumRouteMap: Record<string, string> = {
  SPEAK_NOW: '/matching', FEARLESS: '/matching', REPUTATION: '/matching', TS: '/matching',
  '1989': '/matching', FOLKLORE: '/matching', EVERMORE: '/matching', LOVER: '/matching',
  SHOWGIRL: '/matching', RED: '/matching', MIDNIGHTS: '/matching', TTPD: '/matching', ALBUM: '/matching'
};

const sidebarItems = [
  { name: 'Home', svg: 'home.svg', path: '/catalog' },
  { name: 'Grupos', svg: 'Groups.svg', path: '/updates' },
  { name: 'Analytics', svg: 'analytics.svg', path: '/analytics' },
  { name: 'Perfil', svg: 'profile.svg', path: '/my-profile' },
];

interface IconProps { svgName: string; color: string; size?: number; }
const ThemeIcon: React.FC<IconProps> = ({ svgName, color, size = 24 }) => (
  <div style={{
    width: size, height: size, backgroundColor: color,
    maskImage: `url(/Components/${svgName})`, WebkitMaskImage: `url(/Components/${svgName})`,
    maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center', WebkitMaskPosition: 'center'
  }} />
);

const normalize = (s?: string | null) => {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const SIDEBAR_WIDTH = 150;
  const AVATAR_SIZE = 140;
  const AVATAR_BORDER = 4;

  const [userTheme, setUserTheme] = useState<ThemeKey>('TS');
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);

  const [albumsRankedViaAlbums, setAlbumsRankedViaAlbums] = useState<string[]>([]);
  const [albumsRankedViaTracks, setAlbumsRankedViaTracks] = useState<string[]>([]);
  const [combinedAlbums, setCombinedAlbums] = useState<string[]>([]);
  const [isLoadingRanks, setIsLoadingRanks] = useState(false);

  const [friendRequestStatus, setFriendRequestStatus] = useState<'idle' | 'loading' | 'sent' | 'accepted' | 'error'>('idle');
  const [friendRequestMessage, setFriendRequestMessage] = useState<string | null>(null);

  const albumTitleToKey: Record<string, string> = {
    'taylor swift': 'TS', 'fearless': 'FEARLESS', 'speak now': 'SPEAK_NOW',
    'red': 'RED', '1989': '1989', 'reputation': 'REPUTATION',
    'lover': 'LOVER', 'folklore': 'FOLKLORE', 'evermore': 'EVERMORE',
    'midnights': 'MIDNIGHTS', 'the tortured poets departament': 'TTPD',
    'the life of a showgirl': 'SHOWGIRL',
  };
  const normAlbumMap = Object.fromEntries(Object.entries(albumTitleToKey).map(([k, v]) => [normalize(k), v]));

  const albumKeyToTitle: Record<string, string> = Object.entries(albumTitleToKey).reduce((acc, [title, key]) => {
    acc[key] = title;
    return acc;
  }, {} as Record<string, string>);


  const fetchUsers = useCallback(async (term: string) => {
    if (term.trim() === '') { setSearchResults([]); return; }
    const API_URL = `${import.meta.env.VITE_API_URL}/api/social/users/search/?query=${encodeURIComponent(term)}`;
    const token = localStorage.getItem('authToken'); if (!token) return;
    try {
      const res = await fetch(API_URL, { method: 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res.ok) setSearchResults(await res.json()); else setSearchResults([]);
    } catch (err) { console.error(err); setSearchResults([]); }
  }, []);
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); fetchUsers(e.target.value); };
  const handleResultClick = (id: number) => { navigate(`/profile/${id}`); setSearchTerm(''); setSearchResults([]); };

  const prefixIfRelative = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${import.meta.env.VITE_API_URL}${url}`;
    return url;
  };
  const pickProfileUrl = (p: UserProfile | null) => {
    if (!p) return null;
    return prefixIfRelative(p.profile_picture_url ?? p.profile_picture ?? p.profile_photo ?? null);
  };
  const pickCoverUrl = (p: UserProfile | null) => {
    if (!p) return null;
    return prefixIfRelative(p.cover_picture_url ?? p.cover_url ?? p.cover_image ?? null);
  };
  const getInitials = (name?: string | null, username?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      const first = parts[0][0] ?? '';
      const second = parts[1]?.[0] ?? '';
      return (first + second).toUpperCase();
    }
    if (username) return username.slice(0, 2).toUpperCase();
    return 'U';
  };

  const fetchAlbumByKey = async (albumKeyOrTitle: string, token?: string) => {
    try {
        const base = import.meta.env.VITE_API_URL;
        const res = await fetch(`${base}/api/albums/all/`, {
        headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
        });
        if (!res.ok) return null;
        const albums: any[] = await res.json();
        const targetNorm = normalize(albumKeyOrTitle);
        let found = albums.find(a => a?.title && normalize(a.title) === targetNorm);
        if (!found) found = albums.find(a => a?.title && normalize(a.title).includes(targetNorm));
        if (!found) found = albums.find(a => a?.title && targetNorm.includes(normalize(a.title)));
        return found ?? null;
    } catch (err) {
        console.error('[fetchAlbumByKey] erro', err);
        return null;
    }
    };


  interface RankButtonProps { albumKey: ThemeKey | 'ALBUM'; route: string; colors: typeof themeColorMap['TS']; }
  const RankButton: React.FC<RankButtonProps> = ({ albumKey, route, colors }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [checking, setChecking] = useState(false);
    const firstFile = albumImageMap[albumKey] || 'AlbumFirstVersion.png';
    const secondFile = albumSecondImageMap[albumKey] || 'AlbumsSecondVersion.png';
    const imageUrl = isHovered ? `/RankSecondButtonVersion/${secondFile}` : `/RankFirstButtonVersion/${firstFile}`;

    const handleClick = async () => {
      if (!userId) { alert('Usuário alvo indefinido.'); return; }
      const token = localStorage.getItem('authToken') || undefined;

      if (albumKey === 'ALBUM') {
        const qs = `?targetUserId=${encodeURIComponent(String(userId))}&matchType=albums`;
        const state = { targetUserId: Number(userId), matchType: 'albums' };
        navigate(`${route}${qs}`, { state });
        return;
      }

      setChecking(true);
      try {
        const albumTitleToSearch = albumKeyToTitle[albumKey] || String(albumKey);
        const album = await fetchAlbumByKey(albumTitleToSearch, token);
        
        if (!album) {
          alert('Não foi possível identificar o álbum no servidor. Acesso bloqueado.');
          return;
        }
        const albumId = album.id;
        const albumTitle = album.title ?? String(albumKey);

        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const tracksRes = await fetch(`${import.meta.env.VITE_API_URL}/api/rankings/tracks/${albumId}/`, {
          method: 'GET',
          headers
        });

        if (!tracksRes.ok) {
          if (tracksRes.status === 401) {
            alert('Sessão expirada. Faça login novamente.');
            navigate('/login');
            return;
          }
          alert('Erro ao verificar rankings de faixas. Tente novamente.');
          return;
        }

        const data = await tracksRes.json();
        const rankings = Array.isArray(data.rankings) ? data.rankings : [];
        if (rankings.length > 0) {
          const qs = `?targetUserId=${encodeURIComponent(String(userId))}&albumId=${encodeURIComponent(String(albumId))}&albumTitle=${encodeURIComponent(String(albumTitle))}&matchType=tracks`;
          const state = {
            targetUserId: Number(userId),
            albumId: Number(albumId),
            albumTitle: String(albumTitle),
            matchType: 'tracks'
          };
          navigate(`${route}${qs}`, { state });
        } else {
          alert('Você precisa ranquear as tracks deste álbum antes de usar o matching.');
        }
      } catch (err) {
        console.error('[RankButton click] erro', err);
        alert('Erro interno ao checar ranking. Veja o console.');
      } finally {
        setChecking(false);
      }
    };

    return (
      <button
        style={{
          flex: '0 0 calc(33.333% - 8px)',
          padding: 80,
          borderRadius: 8,
          border: 'none',
          cursor: checking ? 'wait' : 'pointer',
          backgroundColor: '#FFF9F9',
          color: '#FFF9F9',
          fontWeight: 600,
          backgroundImage: `url(${imageUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: isHovered ? '120%' : 'contain',
          transition: 'background-size 180ms ease',
          opacity: checking ? 0.7 : 1,
        }}
        aria-label={`Rank de ${albumKey}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={handleClick}
        disabled={checking}
      >
        <span style={{ color: 'transparent' }}>{albumKey}{checking ? ' (verificando...)' : ''}</span>
      </button>
    );
  };

  useEffect(() => {
    const fetchUserTheme = async () => {
        const base = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('authToken');
        if (!token) { setIsLoadingTheme(false); return; }
        try {
        const res = await fetch(`${base}/api/users/me/current-theme/`, { method: 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        if (res.ok) {
            const data = await res.json();
            const receivedTheme = data.tema as ThemeKey;
            if (receivedTheme && receivedTheme in themeColorMap) setUserTheme(receivedTheme);
        }
        } catch (err) { console.error('Erro fetch theme', err); }
        finally { setIsLoadingTheme(false); }
    };
    fetchUserTheme();
    }, []);


  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setIsLoadingProfile(true);
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/`, { headers: { Authorization: `Bearer ${token || ''}` } });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setUserProfile(data);
      } catch (err) {
        console.error('Erro fetch profile', err);
        setUserProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const fetchRankedTitles = async () => {
      if (!userId) return;
      const token = localStorage.getItem('authToken');
      if (!token) return;
      setIsLoadingRanks(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rankings/user/${userId}/ranked-titles/`, { method: 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        if (!res.ok) {
          setAlbumsRankedViaAlbums([]); setAlbumsRankedViaTracks([]); setCombinedAlbums([]);
          return;
        }
        const data = await res.json();
        const dedupe = (arr?: any[]) => Array.from(new Set((arr ?? []).filter(Boolean).map(String).map(s => s.trim())));
        setAlbumsRankedViaAlbums(dedupe(data.albums_ranked_via_albums));
        setAlbumsRankedViaTracks(dedupe(data.albums_ranked_via_tracks));
        setCombinedAlbums(dedupe(data.combined_albums));
      } catch (err) {
        console.error('[ranked] erro', err);
        setAlbumsRankedViaAlbums([]); setAlbumsRankedViaTracks([]); setCombinedAlbums([]);
      } finally {
        setIsLoadingRanks(false);
      }
    };
    fetchRankedTitles();
  }, [userId]);

  const handleSendFriendRequest = async () => {
    if (!userId) return;
    setFriendRequestStatus('loading'); setFriendRequestMessage(null);
    try {
        const token = localStorage.getItem('authToken');
        console.log('sending friend request to user', userId, 'token?', !!token);
        const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/social/users/${userId}/request-friendship/`,
        {},
        { headers: { Authorization: `Bearer ${token || ''}` } }
        );
        console.log('friend req response', res.status, res.data);
        if (res.status === 201) { setFriendRequestStatus('sent'); setFriendRequestMessage(res.data.message); }
        else if (res.status === 200) { setFriendRequestStatus('accepted'); setFriendRequestMessage(res.data.message); }
    } catch (err:any) {
        console.error('friend req error', err?.response ?? err);
        setFriendRequestStatus('error'); setFriendRequestMessage(err.response?.data?.error || 'Erro ao enviar pedido');
    }
    };


  if (isLoadingTheme) return (<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p>Carregando tema...</p></div>);

  const colors = themeColorMap[userTheme];
  const profileUrl = pickProfileUrl(userProfile);
  const coverUrl = pickCoverUrl(userProfile);
  const gradientDark = `linear-gradient(90deg, ${colors.dark}CC, ${colors.dark}77)`;

  let sourceAlbumTitles: string[] = [];
  if (albumsRankedViaTracks.length > 0) sourceAlbumTitles = Array.from(new Set(albumsRankedViaTracks));
  else if (albumsRankedViaAlbums.length > 0) sourceAlbumTitles = Array.from(new Set(albumsRankedViaAlbums));

  let albumKeysOrTitles = Array.from(new Set(sourceAlbumTitles.map(title => {
    const nk = normalize(title);
    return normAlbumMap[nk];
  }).filter(Boolean))) as (ThemeKey | 'ALBUM')[];

  if (albumsRankedViaTracks.length > 0 || albumsRankedViaAlbums.length > 0) {
    albumKeysOrTitles.unshift('ALBUM');
    albumKeysOrTitles = Array.from(new Set(albumKeysOrTitles));
  }

  let albumLine: string;
  if (albumsRankedViaTracks.length > 0) albumLine = ['Albums', ...albumKeysOrTitles.filter(k => k !== 'ALBUM')].join(', ');
  else if (albumsRankedViaAlbums.length > 0) albumLine = 'Albums';
  else albumLine = 'Albums (nenhum album ranqueado)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      {/* SIDEBAR */}
      <div style={{ width: SIDEBAR_WIDTH, minHeight: '100vh', backgroundColor: colors.dark, padding: '20px 8px', boxShadow: '4px 0 8px rgba(0,0,0,0.2)', color: colors.light, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 140, height: 140, backgroundColor: colors.light, maskImage: `url(/Components/Logo.svg)`, WebkitMaskImage: `url(/Components/Logo.svg)`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          {sidebarItems.map((item) => (
            <button key={item.name} onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 4px', border: 'none', borderRadius: 4, cursor: 'pointer', backgroundColor: 'transparent', color: colors.light, transition: 'background-color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${colors.light}22`)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <ThemeIcon svgName={item.svg} color={colors.light} size={62} />
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flexGrow: 1, width: `calc(100vw - ${SIDEBAR_WIDTH}px)`, minWidth: 0, backgroundColor: colors.light, padding: 32, boxSizing: 'border-box' }}>
        {/* SEARCH */}
        <div style={{ marginBottom: 16, width: '97.5%', position: 'relative' }}>
          <input type="text" placeholder="Search" value={searchTerm} onChange={handleSearchChange} style={{ width: '100%', padding: '10px 15px', borderRadius: 8, border: 'none', fontSize: 16, outline: 'none', boxShadow: 'none', backgroundColor: '#fff', color: colors.dark }} />
          {searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: -30, backgroundColor: '#FFFFFF', border: `1px solid ${colors.dark}`, borderTop: 'none', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: 30, maxHeight: 200, overflowY: 'auto' }}>
              {searchResults.map((user) => (
                <div key={user.id} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#000', fontWeight: 500 }} onClick={() => handleResultClick(user.id)}>
                  {user.username}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COVER + AVATAR */}
        <div style={{ width: '100%', marginTop: 8 }}>
          <div style={{ width: '100%', height: 200, position: 'relative', backgroundColor: '#f3f3f3' }}>
            {isLoadingProfile ? <div style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} /> : coverUrl ? <img src={coverUrl as string} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: gradientDark }} />}
            <div style={{
              position: 'absolute',
              left: 40,
              bottom: -AVATAR_SIZE / 2 + 12,
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: '50%',
              border: `${AVATAR_BORDER}px solid ${colors.light}`,
              backgroundColor: '#ddd',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200
            }}>
              {isLoadingProfile ? <div style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} /> : profileUrl ? (
                <img src={profileUrl as string} alt={userProfile?.username} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : userProfile ? (
                <div style={{ width: '100%', height: '100%', backgroundColor: colors.dark, color: colors.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {getInitials(userProfile.first_name ?? null, userProfile.username ?? '')}
                </div>
              ) : <div style={{ width: '100%', height: '100%', backgroundColor: '#ccc' }} />}
            </div>
          </div>
        </div>

        {/* INFO ROW */}
        <div style={{ marginTop: 2, paddingLeft: 40, display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ width: AVATAR_SIZE + 8 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.dark }}>{isLoadingProfile ? 'Carregando...' : (userProfile?.first_name ?? userProfile?.username ?? 'Usuário')}</div>
            <div style={{ color: colors.dark, opacity: 0.85 }}>@{isLoadingProfile ? '' : (userProfile?.username ?? '')}</div>
          </div>

          <div style={{ marginLeft: 70, display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: colors.dark, opacity: 0.85, fontSize: 13 }}>Friends</div>
              <div style={{ fontWeight: 700, color: colors.dark }}>{isLoadingProfile ? '-' : (userProfile?.friends_count ?? 0)}</div>
            </div>

            {/* Botão de amizade */}
            <div>
              <button
                onClick={handleSendFriendRequest}
                disabled={friendRequestStatus === 'loading' || friendRequestStatus === 'sent' || friendRequestStatus === 'accepted'}
                style={{ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: colors.dark, color: colors.light, fontWeight: 600 }}
              >
                {friendRequestStatus === 'loading' ? 'Enviando...' : friendRequestStatus === 'sent' ? 'Pedido Enviado' : friendRequestStatus === 'accepted' ? 'Amigos' : 'Pedir Amizade'}
              </button>
              {friendRequestMessage && <div style={{ marginTop: 6, color: colors.dark }}>{friendRequestMessage}</div>}
            </div>
          </div>
        </div>

        {/* RANKS */}
        <div style={{ marginTop: 28, backgroundColor: 'transparent', color: colors.dark }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Ranks:</div>
          {isLoadingRanks ? (
            <div style={{ color: colors.dark }}>Carregando rankings...</div>
          ) : (
            <>
              {albumKeysOrTitles.length > 0 ? (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {albumKeysOrTitles.map((albumKeyOrTitle) => {
                    const keyToUse = albumKeyOrTitle as ThemeKey | 'ALBUM';
                    const route = albumRouteMap[keyToUse] || '/catalog';
                    return <RankButton key={keyToUse} albumKey={keyToUse} route={route} colors={colors} />;
                  })}
                </div>
              ) : (
                <div style={{ color: colors.dark, opacity: 0.85 }}>Nenhum rank de álbum ou faixa completado.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;