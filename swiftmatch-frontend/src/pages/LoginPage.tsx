import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState<string>(''); 
    const [password, setPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        const loginPayload = { username, password };
        const loginEndpoint = '/api/auth/token/'; 
        const firstLoginCheckEndpoint = '/api/users/me/first-login/'; 

        try {
            // PASSO 1: Autenticar e obter o Token
            const loginResponse = await API.post(loginEndpoint, loginPayload);
            
            const token = loginResponse.data.access || loginResponse.data.auth_token || loginResponse.data.token;
            
            if (!token) {
                 setMessage("Sucesso no login, mas nenhum token recebido. Verifique o backend.");
                 return;
            }

            // Configurar o token para todas as requisições futuras
            localStorage.setItem('authToken', token);
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
            
            setMessage("Login bem-sucedido. Verificando estado inicial...");

            // PASSO 2: Verificar o estado 'first_login'
            const firstLoginResponse = await API.get(firstLoginCheckEndpoint);
            
            // 🚨 LOG DE DEBUG: VERIFIQUE ESTE VALOR NO CONSOLE DO NAVEGADOR!
            console.log("Resposta do /first-login/:", firstLoginResponse.data);

            // Espera-se que a resposta seja: { "first_login": true/false }
            // Se o backend enviar "false", ou não enviar nada, cai para false.
            const isFirstLogin = firstLoginResponse.data.first_login === null;
            
            console.log("isFirstLogin avaliado como:", isFirstLogin);


            let redirectPath = '/profile';
            if (isFirstLogin) {
                redirectPath = '/theme-selection';
                setMessage("Bem-vindo(a)! Escolha seu tema...");
            } else {
                setMessage("Redirecionando para o perfil...");
            }
            
            setTimeout(() => {
                navigate(redirectPath); 
            }, 1500);

        } catch (error: any) {
            console.error("Erro durante o Login ou Verificação:", error);
            
            let errorMessage = "Erro na comunicação ou credenciais inválidas.";
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (status === 401) {
                    errorMessage = `Acesso Negado (401). Verifique se o token é Bearer ou se está expirado.`;
                } else if (status === 404) {
                     errorMessage = `Erro 404: Verifique se a rota ${loginEndpoint} ou ${firstLoginCheckEndpoint} está correta no seu Django.`;
                } else if (status === 400) {
                     if (data.non_field_errors) {
                         errorMessage = `Erro de Credenciais: ${data.non_field_errors[0]}`;
                     } else {
                         errorMessage = "Credenciais inválidas. Verifique seu nome de usuário e senha.";
                     }
                } else if (data.detail) {
                    errorMessage = data.detail;
                }
            } else if (error.request) {
                 errorMessage = "Erro de rede. Verifique se o Docker está rodando.";
            }
            
            setMessage(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 md:p-10 rounded-xl shadow-2xl max-w-sm w-full" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Acesse sua conta
                </h2>
                
                <form onSubmit={handleLogin} className="flex flex-col gap-4">

                    <input 
                        type="text" 
                        placeholder="Nome de Usuário" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        className="p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                    />
                    
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

                {/* Link para Cadastro */}
                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-500">
                        Não tem uma conta?
                    </span>
                    <button 
                        type="button" 
                        onClick={() => navigate('/register')} 
                        className="ml-2 font-medium text-pink-600 hover:text-pink-700 bg-transparent p-0 border-none"
                    >
                        Cadastre-se
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;