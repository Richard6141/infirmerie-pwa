import axios from 'axios';
import { STORAGE_KEYS } from './utils/constants';

// Base URL de l'API (avec versioning)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://infirmerie-api.onrender.com';
const API_VERSION = '/v1';

// Instance axios configurée
export const api = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à toutes les requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    // console.log('[API REQUEST]', config.method?.toUpperCase(), config.url);
    // console.log('[API TOKEN]', token ? `Token présent (${token.substring(0, 20)}...)` : 'Aucun token trouvé');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs HTTP
api.interceptors.response.use(
  (response) => {
    // Logs uniquement en développement
    if (import.meta.env.DEV) {
      console.log('[API RESPONSE]', response.status, response.config.url);
      console.log('[API RESPONSE DATA]', response.data);
    }
    return response;
  },
  (error) => {
    // Logs d'erreur toujours visibles mais plus détaillés en dev
    if (import.meta.env.DEV) {
      console.error('[API ERROR]', error.response?.status, error.config?.url);
      console.error('[API ERROR DETAILS]', error.response?.data);

      // Log detailed validation errors if present
      if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
        console.error('[API VALIDATION ERRORS]', error.response.data.message);
      }
    } else {
      // En production, log minimal
      console.error('[API ERROR]', error.response?.status, error.config?.url);
    }

    // Gérer le cas où l'utilisateur doit changer son mot de passe
    if (error.response?.status === 403 && error.response?.data?.mustChangePassword) {
      if (import.meta.env.DEV) {
        console.warn('[AUTH] Changement de mot de passe requis');
      }
      // Rediriger vers la page de changement de mot de passe
      window.location.href = '/change-password?required=true';
    }

    if (error.response?.status === 401) {
      if (import.meta.env.DEV) {
        console.warn('[AUTH] Token invalide ou expiré - déconnexion');
      }
      // Token expiré ou invalide, déconnecter l'utilisateur
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper pour gérer les erreurs API
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.status === 404) {
      return 'Ressource non trouvée';
    }
    if (error.response?.status === 500) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }
    if (!error.response) {
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    }
    return error.message;
  }
  return 'Une erreur inattendue est survenue';
};
