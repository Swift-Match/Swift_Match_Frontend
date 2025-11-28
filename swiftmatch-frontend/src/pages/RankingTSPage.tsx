import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TS_ALBUM_ID = 1; 
const API_BASE_URL = import.meta.env.VITE_API_URL + '/api';

const COMPONENT_MAX_WIDTH = 800;
const HEADER_HEIGHT = 80;
const GAP_PX = 50;
const ALBUM_SCALE = 1.4;

const TS_DARK = '#0C1A0C';   
const TS_LIGHT = '#A9CBAA';  

interface Track {
  id: number;
  title: string;
  track_number: number;
  album: number;
}

interface ButtonCustomProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  background?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
  onClick?: () => void;
  children: React.ReactNode;
}

const ButtonCustom: React.FC<ButtonCustomProps> = ({
  width = '50px',
  height = '50px',
  borderRadius = 8,
  background = TS_DARK,
  color = TS_LIGHT,
  fontSize = 16,
  fontWeight = 700,
  onClick,
  children,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        width,
        height,
        borderRadius,
        background,
        color,
        fontSize,
        fontWeight,
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'transform 0.1s ease',
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {children}
    </button>
  );
};

const LogoSVG: React.FC<{ color?: string; height?: number }> = ({ color = TS_LIGHT, height = 40 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 299 75"
    style={{ height, width: 'auto', display: 'block' }}
    </svg>
);


const RankingTSPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // refs para drag
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  // busca as faixas
  const fetchTracks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');

    if (!token) {
      setError('Usuário não autenticado. Por favor, faça login.');
      setIsLoading(false);
      return;
    }

    const url = `${API_BASE_URL}/tracks/album/${TS_ALBUM_ID}/`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error('Álbum não encontrado ou endpoint inválido.');
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || `Falha ao buscar músicas: ${response.status}`);
      }

      const data: Track[] = await response.json();
      data.sort((a, b) => (a.track_number ?? 0) - (b.track_number ?? 0));
      setTracks(data);
    } catch (err: any) {
      console.error('Erro ao buscar faixas:', err);
      setError(err?.message || 'Erro desconhecido ao carregar as músicas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  // reorder quando soltar
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragItemIndex.current;
    const to = dragOverItemIndex.current;
    if (from === null || to === null) return;
    if (from === to) {
      dragItemIndex.current = null;
      dragOverItemIndex.current = null;
      return;
    }

    setTracks((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });

    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItemIndex.current = index;
    const crt = document.createElement('div');
    crt.style.width = '0px';
    crt.style.height = '0px';
    // @ts-ignore
    e.dataTransfer.setDragImage(crt, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItemIndex.current = index;
  };

  const handleDragEnd = (_e: React.DragEvent) => {
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  // salvar ranking
  const handleSaveRanking = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Usuário não autenticado.');
        setError('Usuário não autenticado. Por favor, faça login.');
        return;
    }

    // 1. Mapeia o estado atual (tracks) para o formato esperado pelo Serializer
    const rankingsPayload = tracks.map((track, index) => ({
        track_id: track.id,
        position: index + 1,
    }));
    
    const payload = {
        album_id: TS_ALBUM_ID,
        rankings: rankingsPayload
    };

    const url = `${API_BASE_URL}/rankings/tracks/${TS_ALBUM_ID}/`;

    try {
        const response = await fetch(url, {
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const errorMessage = errorBody.errors ? JSON.stringify(errorBody.errors) : (errorBody.detail || `Falha ao salvar ranking: ${response.status}`);
            throw new Error(errorMessage);
        }
        
        console.log('Ranking salvo com sucesso!', rankingsPayload);
        
        navigate('/catalog'); // <-- CHAMADA PARA REDIRECIONAR
        
    } catch (err: any) {
        console.error('Erro ao salvar ranking:', err.message);
        setError(`Falha ao salvar ranking: ${err.message}`);
    }
};

  // layout vars
  const wrapperBg = TS_LIGHT;
  const fadeWidth = 120;
  const indicatorHeight = 120;
  const extraVertical = Math.round((indicatorHeight * (ALBUM_SCALE - 1)) + 16);
  const rowShift = -(indicatorHeight + GAP_PX);

  const renderTrackList = () => {
    if (isLoading) {
      return <div style={{ textAlign: 'center', padding: 40, color: TS_DARK }}>Carregando a lista de músicas do Speak Now...</div>;
    }

    if (error) {
      return <div style={{ textAlign: 'center', padding: 40, color: TS_DARK, fontWeight: 'bold' }}>Erro: {error}</div>;
    }

    if (tracks.length === 0) {
      return <div style={{ textAlign: 'center', padding: 40, color: TS_DARK }}>Nenhuma música encontrada para este álbum.</div>;
    }

    return (
      <>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',  gap: 8, justifyContent: 'start' }}>
          {tracks.map((track, index) => {
            const isDragging = dragItemIndex.current === index;
            return (
              <li key={track.id} style={{ margin: 0 }}>
                <button
                  type="button"
                  draggable
                  aria-grabbed={isDragging}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  style={{
                    width: '120px',
                    height: '160px',
                    position: 'relative', // <<< importante
                    display: 'flex',
                    alignItems: 'flex-start', // alinha o conteúdo no topo
                    justifyContent: 'space-between',
                    padding: '10px',
                    borderRadius: 10,
                    border: `1px solid ${TS_DARK}30`,
                    background: TS_DARK,
                    color: TS_DARK,
                    cursor: 'grab',
                    textAlign: 'left',
                    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: 130, 
                    left: 80, 
                    width: 23, 
                    height: 23, 
                    borderRadius: 6, 
                    background: TS_DARK, 
                    color: TS_LIGHT, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 14, 
                    fontWeight: 900 
                  }}>
                    #{index + 1}
                  </div>

                    {/* Conteúdo do título e track_number */}
                    <div style={{
                      fontSize: 16,
                      color: TS_LIGHT,
                      fontWeight: 600,
                      marginTop: 10,   
                      marginLeft: 0, 
                      wordBreak: 'break-word',
                      whiteSpace: 'normal'
                    }}>
                      {track.title}
                    </div>


                </button>

                {dragOverItemIndex.current === index && dragItemIndex.current !== index && (
                  <div style={{ height: 11, background: TS_DARK, borderRadius: 2, margin: '4px 0', opacity: 0.5, transition: 'all 0.2s' }} />
                )}
              </li>
            );
          })}
        </ul>
      </>
    );
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: wrapperBg, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 80, fontFamily: '"Inter", sans-serif' }}>
      <header
        style={{
          width: '100%',
          height: HEADER_HEIGHT,
          background: TS_DARK,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '5%',
          justifyContent: 'flex-start',
          position: 'fixed',
          top: 0,
          zIndex: 100,
        }}
      >
        <LogoSVG color={TS_LIGHT} height={40} />
      </header>

      <div style={{ height: 120, width: '100%' }} />

      <h1 style={{ color: TS_DARK, fontSize: 40, fontWeight: 800, marginBottom: 12 }}>
        Taylor Swift Ranking
      </h1>

      <p style={{ color: TS_DARK, marginBottom: 40, fontSize: 18, textAlign: 'center' }}>
        Drag and drop the songs to create your ultimate ranking!
      </p>

      <div style={{ width: '100%', margin: '8px auto', padding: '0 20px', boxSizing: 'border-box' }}>
        {renderTrackList()}
      </div>

      {/* Botão Salvar Ranking */}
      <div style={{ width: '100%', margin: '8px auto 56px', display: 'flex', justifyContent: 'flex-end', padding: '0 20px', boxSizing: 'border-box', position: 'relative' }}>
        <ButtonCustom
          width={220}      
          height={60}     
          borderRadius={30} 
          onClick={handleSaveRanking}
        >
          Save Ranking
        </ButtonCustom>
      </div>
    </div>
  );
};

export default RankingTSPage;
