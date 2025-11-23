import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [firstName, setFirstName] = useState<string>(''); 
    const [country, setCountry] = useState<string>('');     
    
    const [message, setMessage] = useState<string>('');
    const navigate = useNavigate();

    // Limpa tokens antigos ao abrir a página para evitar conflito (Erro 401)
    useEffect(() => {
        localStorage.removeItem('authToken');
        delete API.defaults.headers.common['Authorization'];
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        // 1. Garante limpeza de credenciais antigas antes de enviar
        localStorage.removeItem('authToken');
        delete API.defaults.headers.common['Authorization'];

        const registrationPayload = { 
            username, 
            email, 
            password, 
            first_name: firstName, 
            country: country,      
        };
        
        const registerEndpoint = '/api/users/register/'; 
        const loginEndpoint = '/api/auth/token/'; // Endpoint correto de login

        let registrationSuccessful = false;

        try {
            // PASSO 1: Registrar o usuário (Sem token no cabeçalho)
            await API.post(registerEndpoint, registrationPayload);
            registrationSuccessful = true;

            // PASSO 2: Fazer login automático
            const loginPayload = { username, password }; // Ou email, dependendo do seu backend
            const loginResponse = await API.post(loginEndpoint, loginPayload);
            
            const token = loginResponse.data.access || loginResponse.data.auth_token || loginResponse.data.token;
            
            if (token) {
                localStorage.setItem('authToken', token);
                API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                setMessage("Registro e Login bem-sucedidos! Redirecionando...");
                
                // Como é um registro novo, assumimos que é o primeiro login
                setTimeout(() => {
                    navigate('/theme-selection'); 
                }, 2000);
            } else {
                // Caso raro: registro funcionou, mas login não retornou token
                setMessage("Registro concluído! Faça login manualmente.");
                setTimeout(() => navigate('/login'), 2000);
            }

        } catch (error: any) {
            console.error("Erro no Fluxo de Registro/Login:", error);
            
            if (registrationSuccessful) {
                setMessage("Registro concluído! O login automático falhou. Por favor, faça login manualmente.");
                setTimeout(() => navigate('/login'), 2000);
                return;
            } else {
                let errorMessage = "Erro na comunicação com o backend ou dados inválidos.";
                
                if (error.response) {
                    const status = error.response.status;
                    const data = error.response.data;
                    
                    // Tratamento específico para 401 no Registro
                    if (status === 401) {
                        errorMessage = "Erro de Permissão (401). O navegador enviou credenciais antigas. Tente recarregar a página (F5).";
                    } else if (typeof data === 'object' && data !== null) {
                         const fieldErrors = Object.keys(data)
                             .map(key => {
                                 const errorArray = Array.isArray(data[key]) ? data[key] : [data[key]];
                                 return `${key.replace('_', ' ')}: ${errorArray.join(', ')}`;
                             })
                             .join('; ');
                             
                        errorMessage = data.detail || data.non_field_errors?.[0] || fieldErrors || errorMessage;
                        
                        if (errorMessage.includes("already exists")) {
                             errorMessage = "Usuário: Um usuário com esse nome já existe. Tente outro nome.";
                        }
                    }
                } else if (error.request) {
                     errorMessage = "Erro de rede. Verifique se o Docker está rodando.";
                }
                
                setMessage(`Falha no Registro: ${errorMessage}`);
            }
        }
    };

    return (
        <div className="bg-white p-8 md:p-10 rounded-xl shadow-2xl max-w-sm w-full mx-auto my-10" 
             style={{ fontFamily: 'Inter, sans-serif' }}>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Crie sua conta SwiftMatch
            </h2>
            
            <form onSubmit={handleRegister} className="flex flex-col gap-4">

                <input 
                    type="text" 
                    placeholder="Primeiro Nome (first_name)" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                />

                <input 
                    type="text" 
                    placeholder="País (country)" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    required 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                />
                
                <input 
                    type="text" 
                    placeholder="Nome de Usuário" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                />
                
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
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
                    Registrar
                </button>
            </form>
            
            {message && (
                <p className={`mt-4 text-center text-sm ${message.includes('bem-sucedidos') || message.includes('concluído') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </p>
            )}

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">
                    Já tem uma conta?
                </span>
                <button 
                    type="button" 
                    onClick={() => navigate('/login')} 
                    className="ml-2 font-medium text-pink-600 hover:text-pink-700 bg-transparent p-0 border-none"
                >
                    Fazer Login
                </button>
            </div>
        </div>
    );
};

export default RegisterPage;