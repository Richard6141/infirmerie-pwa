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
    updateUser,
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
    updateUser,
    isInfirmier: isInfirmier(),
    isPatient: isPatient(),
    hasRole,
  };
};
