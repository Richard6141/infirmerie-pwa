import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { useAuth } from '@/lib/hooks/useAuth';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  // Récupérer le paramètre "required" de l'URL (ex: /change-password?required=true)
  const isRequired = searchParams.get('required') === 'true';

  // Si non authentifié, rediriger vers le login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url(/back-mdc.jpg)',
        backgroundPosition: 'center center',
      }}
    >
      {/* Overlay semi-transparent pour meilleure lisibilité */}
      <div className="absolute inset-0 bg-white/50"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-4">
          <img
            src="/logo-mdc.png"
            alt="Logo MDC"
            className="w-full h-auto max-h-32 object-contain mx-auto drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'flex items-center justify-center w-full h-32 bg-gradient-to-br from-[#3B7DDD] to-[#2E6BC6] rounded-2xl mx-auto shadow-lg';
              fallback.innerHTML = '<svg class="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>';
              e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget);
            }}
          />
        </div>

        {/* Formulaire de changement de mot de passe */}
        <ChangePasswordForm mustChange={isRequired} onSuccess={handleSuccess} />

        {/* Footer */}
        <div className="mt-3 text-center text-xs text-gray-500">
          <p>© 2025 MDC - Sécurité de votre compte</p>
        </div>
      </div>
    </div>
  );
}
