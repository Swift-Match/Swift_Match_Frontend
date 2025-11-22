import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig'; // Usa a instância configurada com VITE_API_URL

const RegisterPage: React.FC = () => {
    // 1. Estados que correspondem EXATAMENTE aos campos do Serializer:
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [firstName, setFirstName] = useState<string>(''); // Corresponde a 'first_name'
    const [country, setCountry] = useState<string>('');     // Corresponde a 'country'
    
    // Estado para mensagens de erro/sucesso
    const [message, setMessage] = useState<string>('');
    
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        // Payload com os nomes de campo EXATOS do Django Serializer
        const payload = { 
            username, 
            email, 
            password, 
            first_name: firstName, 
            country: country,      
        };
        
        // CORREÇÃO CRÍTICA: Endpoint CORRETO conforme o Swagger: /api/users/register/
        const endpoint = '/api/users/register/'; 

        try {
            await API.post(endpoint, payload);

            // Sucesso
            setMessage("Registro bem-sucedido! Redirecionando para o Login...");
            
            setTimeout(() => {
                navigate('/login'); 
            }, 2000);

        } catch (error: any) {
            console.error("Erro no Registro:", error);
            
            let errorMessage = "Erro na comunicação com o backend ou dados inválidos.";
            
            if (error.response) {
                const data = error.response.data;
                // Tratamento de erros detalhado, incluindo os novos campos
                errorMessage = data.detail || 
                               data.non_field_errors?.[0] || 
                               (data.email ? `Email: ${data.email[0]}` : '') ||
                               (data.username ? `Usuário: ${data.username[0]}` : '') ||
                               (data.password ? `Senha: ${data.password[0]}` : '') ||
                               (data.first_name ? `Primeiro Nome: ${data.first_name[0]}` : '') ||
                               (data.country ? `País: ${data.country[0]}` : '') ||
                               errorMessage;
            } else if (error.request) {
                 // Erro sem resposta (CORS, servidor inativo, ou VITE_API_URL errado)
                 errorMessage = "Erro de rede. Verifique se o Docker está rodando e se o CORS está configurado no Django.";
            }
                                 
            setMessage(errorMessage);
        }
    };

    return (
        <div className="bg-white p-8 md:p-10 rounded-xl shadow-2xl max-w-sm w-full mx-auto my-10" 
             style={{ fontFamily: 'Inter, sans-serif' }}>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Crie sua conta SwiftMatch
            </h2>
            
            <form onSubmit={handleRegister} className="flex flex-col gap-4">

                {/* CAMPO: first_name */}
                <input 
                    type="text" 
                    placeholder="Primeiro Nome (first_name)" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                />

                {/* CAMPO: country */}
                <input 
                    type="text" 
                    placeholder="País (country)" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    required 
                    className="p-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition duration-150"
                />
                
                {/* Campos existentes */}
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
            
            {/* Mensagem de Status */}
            {message && (
                <p className={`mt-4 text-center text-sm ${message.includes('bem-sucedido') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </p>
            )}

            {/* Link para Login */}
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