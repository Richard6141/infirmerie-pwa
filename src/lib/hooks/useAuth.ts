import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,
    login,
    logout,
    clearError,
    isInfirmier,
    isPatient,
    hasRole,
  } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,
    login,
    logout,
    clearError,
    isInfirmier: isInfirmier(),
    isPatient: isPatient(),
    hasRole,
  };
};
