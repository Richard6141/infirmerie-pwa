import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { Heart, Activity, Shield } from 'lucide-react';

// Conseils santé qui défilent
const healthTips = [
  {
    icon: Heart,
    title: 'Hydratation',
    message: 'Buvez au moins 1,5 litre d\'eau par jour pour maintenir une bonne santé.',
  },
  {
    icon: Activity,
    title: 'Activité physique',
    message: '30 minutes d\'exercice par jour réduisent les risques de maladies cardiovasculaires.',
  },
  {
    icon: Shield,
    title: 'Prévention',
    message: 'Les vaccinations régulières protègent votre santé et celle de votre entourage.',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentTip, setCurrentTip] = useState(0);

  // Si déjà connecté, rediriger vers le dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Auto-rotation des conseils santé toutes les 6 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % healthTips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = healthTips[currentTip].icon;

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
        <div className="text-center mb-3">
          <img
            src="/logo-mdc.png"
            alt="Logo MDC"
            className="w-full h-auto max-h-32 object-contain mx-auto drop-shadow-lg"
            onError={(e) => {
              // Fallback si le logo ne charge pas
              e.currentTarget.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'flex items-center justify-center w-full h-32 bg-gradient-to-br from-[#3B7DDD] to-[#2E6BC6] rounded-2xl mx-auto shadow-lg';
              fallback.innerHTML = '<svg class="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>';
              e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget);
            }}
          />
        </div>

        {/* Formulaire de connexion */}
        <LoginForm />

        {/* Conseil santé du jour */}
        <div className="mt-2 bg-white/95 backdrop-blur-md rounded-lg p-2.5 shadow-lg border border-gray-200">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#3B7DDD] to-[#2E6BC6] rounded-lg flex items-center justify-center flex-shrink-0">
              <CurrentIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-h-[40px]">
              <h4 className="text-xs font-semibold text-gray-900 mb-0.5">
                {healthTips[currentTip].title}
              </h4>
              <p className="text-xs text-gray-600 leading-snug">
                {healthTips[currentTip].message}
              </p>
            </div>
          </div>

          {/* Indicateurs */}
          <div className="flex justify-center gap-1 mt-2">
            {healthTips.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentTip ? 'w-4 bg-[#3B7DDD]' : 'w-1 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 text-center text-xs text-gray-500">
          <p>© 2025 MDC</p>
        </div>
      </div>
    </div>
  );
}
