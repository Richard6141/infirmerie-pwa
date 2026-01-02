import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { Role } from '@/lib/types/models';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const location = useLocation();

  // Attendre que l'auth soit initialisée avant de vérifier
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, rediriger vers la page de connexion
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si des rôles spécifiques sont requis, vérifier que l'utilisateur a l'un de ces rôles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(user.role);

    if (!hasAllowedRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
