import { create } from 'zustand';
import type { User, Role } from '../types/models';
import { STORAGE_KEYS } from '../utils/constants';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Nouveau: indique si on a vérifié localStorage
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Helpers
  isInfirmier: () => boolean;
  isPatient: () => boolean;
  hasRole: (role: Role) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false, // Démarre à false
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });

          // Stocker le token dans le localStorage (pour les intercepteurs axios)
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

          set({
            user: response.user,
            token: response.accessToken,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null,
          });

          return response.user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
        } finally {
          // Nettoyer le localStorage
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      loadUserFromStorage: () => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr) as User;
            set({
              user,
              token,
              isAuthenticated: true,
              isInitialized: true,
            });
          } catch (error) {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            set({ isInitialized: true });
          }
        } else {
          set({ isInitialized: true });
        }
      },

      clearError: () => set({ error: null }),

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...updates };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      },

      isInfirmier: () => {
        const { user } = get();
        return user?.role === 'INFIRMIER' || user?.isInfirmier === true;
      },

      isPatient: () => {
        const { user } = get();
        return user?.role === 'PATIENT' || user?.isPatient === true;
      },

      hasRole: (role: Role) => {
        const { user } = get();
        return user?.role === role;
      },
}));
