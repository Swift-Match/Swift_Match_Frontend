import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ThemeSelectionPage from './pages/ThemeSelectionPage'; 
import AlbumRankingPage from './pages/AlbumRankingPage'; 
import CatalogPage from './pages/CatalogPage';
import ProfilePage from './pages/ProfilePage'
import UpdatesPage from './pages/UpdatesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import IndividualProfilePage from './pages/IndividualProfilePage';
import RankingSpeakNowPage from './pages/RankingSpeakNowPage';
import RankingFearlessPage from './pages/RankingFearlessPage';
import RankingRepPage from './pages/RankingRepPage';
import RankingTSPage from './pages/RankingTSPage';
import Ranking1989Page from './pages/Ranking1989Page';
import RankingFolklorePage from './pages/RankingFolklorePage';
import RankingEvermorePage from './pages/RankingEvermorePage';
import RankingLoverPage from './pages/RankingLoverPage';
import RankingShowgirlPage from './pages/RankingShowgirlPage';
import RankingRedPage from './pages/RankingRedPage';
import RankingMidnightsPage from './pages/RankingMidnightsPage';
import RankingTTPDPage from './pages/RankingTTPDPages';
import MatchingPage from './pages/MatchingPage';

const App: React.FC = () => {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    
                    {/* Rota 1: Login */}
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* Rota 2: Registro */}
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* *** ROTA ADICIONADA: Seleção de Tema *** */}
                    <Route path="/theme-selection" element={<ThemeSelectionPage />} />
                    
                    {/* Rota Raiz: Redireciona para /login */}
                    <Route path="/" element={<Navigate to="/login" replace />} /> 

                    <Route path="/album-ranking" element={<AlbumRankingPage />} />

                    <Route path="/catalog" element={<CatalogPage />} />

                    <Route path="/profile/:userId" element={<ProfilePage />} />

                    <Route path="/updates" element={<UpdatesPage />} />

                    <Route path="/analytics" element={<AnalyticsPage />} />

                    <Route path="/my-profile" element={<IndividualProfilePage />} />

                    <Route path="/speak-now" element={<RankingSpeakNowPage />} />

                    <Route path="/fearless" element={<RankingFearlessPage />} />

                    <Route path="/reputation" element={<RankingRepPage />} />
    
                    <Route path="/taylor-swift" element={<RankingTSPage />} />

                    <Route path="/1989" element={<Ranking1989Page />} />

                    <Route path="/folklore" element={<RankingFolklorePage />} />

                    <Route path="/evermore" element={<RankingEvermorePage />} />

                    <Route path="/lover" element={<RankingLoverPage />} />

                    <Route path="/showgirl" element={<RankingShowgirlPage />} />

                    <Route path="/red" element={<RankingRedPage />} />

                    <Route path="/midnights" element={<RankingMidnightsPage />} />

                    <Route path="/ttpd" element={<RankingTTPDPage />} />

                    <Route path="/matching" element={<MatchingPage />} />

                    {/* 404 */}
                    <Route path="*" element={<h1>404 - Página Não Encontrada</h1>} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;