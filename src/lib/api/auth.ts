import { api, handleApiError } from '../api';
import type { LoginRequest, LoginResponse, RegisterRequest, ApiResponse } from '../types/api';
import type { User } from '../types/models';

export const authApi = {
  // Connexion
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Inscription (si nécessaire)
  register: async (data: RegisterRequest): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post<ApiResponse<User>>('/auth/register', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Récupérer l'utilisateur connecté
  me: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Déconnexion (optionnel si besoin d'invalidation côté serveur)
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // On ignore les erreurs de déconnexion côté serveur
      console.error('Erreur lors de la déconnexion:', handleApiError(error));
    }
  },

  // Changer le mot de passe
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await api.post<{ message: string }>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
