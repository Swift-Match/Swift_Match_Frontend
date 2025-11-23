import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ThemeSelectionPage from './pages/ThemeSelectionPage'; // IMPORTAÇÃO NECESSÁRIA

// Componente temporário de Perfil (Destino após escolher o tema)
const ProfilePage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="p-8 text-center max-w-md w-full rounded-xl shadow-lg bg-white">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Página de Perfil</h1>
                <p className="text-gray-600 mt-2">Você foi registrado e o próximo passo seria ver seu perfil com o tema escolhido.</p>
                <p className="mt-4 text-sm text-pink-500 font-medium">Esta tela deve herdar a paleta de cores escolhida!</p>
            </div>
        </div>
    );
};


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
                    
                    {/* *** ROTA ADICIONADA: Perfil *** */}
                    <Route path="/profile" element={<ProfilePage />} />
                    
                    {/* Rota Raiz: Redireciona para /login */}
                    <Route path="/" element={<Navigate to="/login" replace />} /> 

                    {/* 404 */}
                    <Route path="*" element={<h1>404 - Página Não Encontrada</h1>} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;