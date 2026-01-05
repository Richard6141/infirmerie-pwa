import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/useAuth';

// Schéma de validation
const loginSchema = z.object({
  email: z.string().min(1, 'L\'adresse email est requise').email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      toast.success('Connexion réussie');

      // Vérifier si l'utilisateur doit changer son mot de passe
      if (result?.mustChangePassword) {
        navigate('/change-password?required=true');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      toast.error('Échec de connexion', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-2xl border border-gray-200 bg-white/95 backdrop-blur-md">
      <CardHeader className="pb-2 pt-4 text-center">
        <CardTitle className="text-xl font-bold text-gray-900 mb-1">
          Portail Infirmerie MDC
        </CardTitle>
        <p className="text-sm font-medium text-gray-700">Connexion</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="votre.email@mdc.bj"
                className="pl-10 h-10"
                {...register('email')}
                disabled={isLoading || isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-600 mt-1 animate-in fade-in-0 slide-in-from-top-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-10"
                {...register('password')}
                disabled={isLoading || isSubmitting}
              />
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-600 mt-1 animate-in fade-in-0 slide-in-from-top-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Bouton de connexion */}
          <Button
            type="submit"
            className="w-full h-10 bg-[#3B7DDD] hover:bg-[#2E6BC6] text-white font-medium mt-4"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Se connecter
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
