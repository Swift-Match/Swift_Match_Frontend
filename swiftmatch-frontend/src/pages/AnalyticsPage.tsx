// src/pages/AnalyticsPage.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface CountryRanking {
  id: number;
  country_name: string; // ex: "BR"
  user_count: number;
  consensus_album?: number | null;
  consensus_album_title?: string | null;
  polarization_album?: number | null;
  polarization_album_title?: string | null;
  global_consensus_track_id?: number | null;
  analysis_data?: any;
  updated_at?: string;
}

interface AlbumStat {
  albumId: number;
  album_title: string;
  avg_rank: number | null;
  std_dev_rank: number;
  votes: number;
}

const albumColorsByCode: Record<string, string> = {
  TS: "#A9CBAA",
  FEARLESS: "#FDDAA6",
  SPEAK_NOW: "#D6BADC",
  RED: "#C7B2A2",
  "1989": "#D1F3FF",
  REPUTATION: "#CACACA",
  LOVER: "#FBB3D1",
  FOLKLORE: "#D5D5D5",
  EVERMORE: "#E0C9AF",
  MIDNIGHTS: "#E0EDFD",
  TTPD: "#EEEDEB",
  SHOWGIRL: "#9CCBC3",
};

const titlesToCode: Record<string, string> = {
  "Taylor Swift": "TS",
  "Taylor Swift (Debut)": "TS",
  "Fearless": "FEARLESS",
  "Speak Now": "SPEAK_NOW",
  "Red": "RED",
  "1989": "1989",
  "Reputation": "REPUTATION",
  "Lover": "LOVER",
  "Folklore": "FOLKLORE",
  "Evermore": "EVERMORE",
  "Midnights": "MIDNIGHTS",
  "The Tortured Poets Department": "TTPD",
  "The Life of a Showgirl": "SHOWGIRL",
};

const sidebarItems = [
  { name: "Home", svg: "home.svg", path: "/catalog" },
  { name: "Groups", svg: "Groups.svg", path: "/groups" },
  { name: "Analytics", svg: "analytics.svg", path: "/analytics" },
  { name: "Profile", svg: "profile.svg", path: "/my-profile" },
];

const ThemeIcon: React.FC<{ svgName: string; color: string; size?: number }> = ({
  svgName,
  color,
  size = 24,
}) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      maskImage: `url(/Components/${svgName})`,
      WebkitMaskImage: `url(/Components/${svgName})`,
      maskSize: "contain",
      WebkitMaskSize: "contain",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }}
  />
);

const getAlbumRankings = (analysisData: any): AlbumStat[] => {
  if (!analysisData) return [];

  // analysisData is expected to contain album-id keyed objects plus other keys like 'summary'
  return Object.entries(analysisData)
    .filter(([key]) => !isNaN(Number(key)))
    .map(([albumId, data]) => ({
      albumId: parseInt(albumId),
      album_title: (data as any).album_title,
      avg_rank: (data as any).avg_rank ?? null,
      std_dev_rank: (data as any).std_dev_rank ?? 0,
      votes: (data as any).votes ?? 0,
    }))
    .sort((a, b) => (a.avg_rank ?? Infinity) - (b.avg_rank ?? Infinity));
};

const AnalyticsPage: React.FC = () => {
  const [countries, setCountries] = useState<CountryRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CountryRanking | null>(null);
  const navigate = useNavigate();

  // Map interaction state
  const INITIAL_ZOOM = 4.0;
  const [zoomLevel, setZoomLevel] = useState(INITIAL_ZOOM);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get("http://localhost:8000/api/rankings/global/", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setCountries(response.data || []);
      } catch (err) {
        console.error("Error fetching global rankings:", err);
        setCountries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selected) return;
    e.preventDefault();
    setIsDragging(true);
    setStartDragPos({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newPanX = e.clientX - startDragPos.x;
      const newPanY = e.clientY - startDragPos.y;
      const viewportWidth = window.innerWidth - 150;
      const viewportHeight = window.innerHeight;

      const buffer = 0.9;
      const panLimitX = (viewportWidth / 2) * zoomLevel * buffer;
      const panLimitY = (viewportHeight / 2) * zoomLevel * buffer;

      setPanX(Math.max(-panLimitX, Math.min(panLimitX, newPanX)));
      setPanY(Math.max(-panLimitY, Math.min(panLimitY, newPanY)));
    },
    [isDragging, startDragPos, zoomLevel]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove]);

  const albumTitleToColor = (title?: string | null) => {
    if (!title) return "#888";
    const code = titlesToCode[title] || titlesToCode[title.trim()] || null;
    if (code && albumColorsByCode[code]) return albumColorsByCode[code];
    const t = title.toLowerCase();
    for (const key of Object.keys(titlesToCode)) {
      if (key.toLowerCase() && t.includes(key.toLowerCase())) {
        const c = titlesToCode[key];
        if (c && albumColorsByCode[c]) return albumColorsByCode[c];
      }
    }
    return "#888";
  };

  const getPositionForIndex = (index: number) => {
    const centerX = (window.innerWidth - 150) / 2 + 150;
    const centerY = window.innerHeight / 2;
    const radius = 75 * Math.sqrt(index + 1);
    const angle = index * 2.399 + Math.PI / 4;
    const left = centerX + radius * Math.cos(angle);
    const top = centerY + radius * Math.sin(angle);
    return { left, top };
  };

  const detailedAlbumRankings = useMemo(() => {
    return selected ? getAlbumRankings(selected.analysis_data) : [];
  }, [selected]);

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading rankings...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      {/* Sidebar (B/W) */}
      <div
        style={{
          flex: "0 0 150px",
          width: 150,
          minHeight: "100vh",
          backgroundColor: "#000",
          color: "#fff",
          padding: "20px 8px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            marginBottom: 24,
            width: 120,
            height: 120,
            backgroundColor: "#fff",
            maskImage: "url(/Components/Logo.svg)",
            WebkitMaskImage: "url(/Components/Logo.svg)",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", alignItems: "center" }}>
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                border: "none",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <ThemeIcon svgName={item.svg} color="#fff" size={60} />
            </button>
          ))}
        </div>
      </div>

      {/* Main black area */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          flex: "1 1 auto",
          position: "relative",
          backgroundColor: "#000",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            minHeight: "100vh",
            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
            transition: isDragging ? "none" : "transform 0.5s ease-out",
            transformOrigin: "center center",
          }}
        >
          {countries.map((country, idx) => {
            const pos = getPositionForIndex(idx);
            const size = Math.max(36, Math.min(220, 28 + country.user_count * 12));
            const color = albumTitleToColor(country.consensus_album_title || undefined);
            return (
              <div
                key={country.id}
                onClick={() => !isDragging && setSelected(country)}
                title={`${country.country_name} — ${country.user_count} users`}
                style={{
                  position: "absolute",
                  left: pos.left - size / 2,
                  top: pos.top - size / 2,
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  backgroundColor: color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(255,255,255,0.06), inset 0 -6px 12px rgba(0,0,0,0.12)",
                  transition: "transform 180ms ease",
                  transformOrigin: "center center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div style={{ textAlign: "center", fontSize: Math.max(10, Math.round(size / 6)) }}>
                  {country.country_name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded overlay for country */}
        {selected && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 120,
              backgroundColor: "rgba(0,0,0,0.95)",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              padding: 40,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>{selected.country_name}</h2>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "#fff", color: "#000", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ minWidth: 260 }}>
                <h3 style={{ marginTop: 0 }}>Active users</h3>
                <p style={{ fontSize: 20 }}>{selected.user_count}</p>

                <h3>Favorite Album</h3>
                <p>{selected.consensus_album_title || "N/A"}</p>

                <h3>Least Favorite Album</h3>
                <p>{selected.polarization_album_title || "N/A"}</p>

                <h3>Favorite Track</h3>
                <p>ID: {selected.global_consensus_track_id ?? "N/A"}</p>

                {(() => {
                  const analysis = selected.analysis_data;
                  const albumIdStr = String(selected.consensus_album);
                  if (analysis && analysis.track_polarization_by_album && analysis.track_analysis_by_album) {
                    const polarizedTrackId = analysis.track_polarization_by_album[albumIdStr];
                    const trackInfo = analysis.track_analysis_by_album[albumIdStr]?.tracks?.[polarizedTrackId];
                    return (
                      <>
                        <h3>Least Favorite Track</h3>
                        <p>
                          {trackInfo?.track_title || `ID ${polarizedTrackId ?? "N/A"}`}
                          {trackInfo && trackInfo.std_dev_rank != null && ` (StdDev: ${trackInfo.std_dev_rank.toFixed(2)})`}
                        </p>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>

              <div style={{ flex: "1 1 480px", minWidth: 280 }}>
                <h3 style={{ marginTop: 0 }}>Album detailed ranking</h3>
                {detailedAlbumRankings.length > 0 ? (
                  <ol style={{ maxHeight: "60vh", overflow: "auto", padding: "0 20px", margin: 0 }}>
                    {detailedAlbumRankings.map((album) => (
                      <li key={album.albumId} style={{ marginBottom: 8, padding: 4, borderBottom: "1px solid #333" }}>
                        <strong>{album.album_title || `Album ID ${album.albumId}`}</strong>
                        <br />
                        Avg: {album.avg_rank !== null ? album.avg_rank.toFixed(2) : "N/A"} | StdDev: {album.std_dev_rank.toFixed(2)} | Votes: {album.votes}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>No detailed ranking data found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
