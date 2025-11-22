import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig'; // Importa a instância configurada do Axios

const LoginPage: React.FC = () => {
    // Estados para os campos do formulário (mantendo username)
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    // Estado para mensagens de erro/sucesso
    const [message, setMessage] = useState<string>('');
    
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Previne o recarregamento da página
        setMessage(''); // Limpa mensagens anteriores

        try {
            // CORREÇÃO CRÍTICA: Endpoint agora é 'api/auth/token/', que corresponde ao Simple JWT no seu urls.py
            const endpoint = '/api/auth/token/';

            const response = await API.post(endpoint, { 
                username: username, // Mantendo o login por username
                password: password, 
            });

            // 1. Armazena os Tokens (agora chamados 'access' e 'refresh')
            const accessToken = response.data.access;
            const refreshToken = response.data.refresh; 
            
            if (accessToken) {
                localStorage.setItem('accessToken', accessToken); 
                localStorage.setItem('refreshToken', refreshToken); 
                
                setMessage("Login bem-sucedido! Redirecionando...");
                
                // 2. Redireciona o usuário para a página principal (Dashboard ou Home)
                setTimeout(() => {
                    navigate('/dashboard'); 
                }, 1000);

            } else {
                setMessage("Resposta do servidor inválida (Token não encontrado).");
            }
        } catch (error: any) {
            console.error("Erro no login:", error);
            
            // Tratamento de erros comuns (Credenciais inválidas ou erro de rede)
            const errorMessage = error.response?.data?.detail || 
                                 error.response?.data?.non_field_errors?.[0] || 
                                 "Credenciais inválidas. Tente novamente.";
            
            setMessage(errorMessage);
        }
    };

    return (
        <div className="bg-white p-8 md:p-10 rounded-xl shadow-2xl max-w-sm w-full mx-auto my-10"
             style={{ fontFamily: 'Inter, sans-serif' }}>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Acesse sua conta SwiftMatch
            </h2>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">

                {/* Campo de Username */}
                <input 
                    type="text" 
                    placeholder="Nome de Usuário" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                />
                
                {/* Campo de Senha */}
                <input 
                    type="password" 
                    placeholder="Senha" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                />
                
                <button 
                    type="submit" 
                    className="p-3 text-white font-semibold rounded-lg transition duration-150 
                               bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-300"
                >
                    Entrar
                </button>
            </form>
            
            {/* Mensagem de Status */}
            {message && (
                <p className={`mt-4 text-center text-sm ${message.includes('bem-sucedido') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </p>
            )}

            {/* Link para Registro */}
            <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">
                    Não tem uma conta?
                </span>
                <button 
                    type="button" 
                    onClick={() => navigate('/register')} 
                    className="ml-2 font-medium text-pink-600 hover:text-pink-700 bg-transparent p-0 border-none"
                >
                    Registre-se
                </button>
            </div>
        </div>
    );
};

export default LoginPage;