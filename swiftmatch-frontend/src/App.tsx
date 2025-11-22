import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // Importa a nova página

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        
        {/* Rota 1: Login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rota 2: Registro (Nova Rota) */}
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rota 3: Dashboard */}
        <Route path="/dashboard" element={<h2>Bem-vindo ao Dashboard! Seu usuário está logado!</h2>} />
        
        {/* Rota Raiz: Redireciona para /login */}
        <Route path="/" element={<Navigate to="/login" replace />} /> 

        {/* 404 */}
        <Route path="*" element={<h1>404 - Página Não Encontrada</h1>} />
      </Routes>
    </Router>
  );
};

export default App;