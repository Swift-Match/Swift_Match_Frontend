import axios, { type AxiosInstance } from 'axios';

// 1. Acessa a URL da API definida no .env (usando import.meta.env.VITE_API_URL)
const API_BASE_URL = import.meta.env.VITE_API_URL;

const API: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    // Define o tipo de conteúdo padrão para JSON
    'Content-Type': 'application/json', 
  },
});

// 2. Interceptor para anexar o token JWT em TODAS as requisições
// Este bloco garante que o backend reconheça o usuário logado
API.interceptors.request.use(
  (config) => {
    // Tenta obter o token de acesso (access_token) do armazenamento local
    const token = localStorage.getItem('access_token');

    if (token) {
      // Se houver token, ele é adicionado ao cabeçalho Authorization
      // Seu backend Django/DRF usará este token para autenticar o usuário
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Exporta a instância configurada do Axios para uso em todas as Views
export default API;