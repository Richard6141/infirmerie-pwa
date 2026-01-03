import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { strongPasswordSchema } from '@/types/patient';
import { authApi } from '@/lib/api/auth';

// Schéma de validation pour le changement de mot de passe
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  /** Si true, affiche un message indiquant que le changement est obligatoire */
  mustChange?: boolean;
  /** Callback appelé après un changement réussi */
  onSuccess?: () => void;
}

export function ChangePasswordForm({ mustChange = false, onSuccess }: ChangePasswordFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);

      toast.success('Mot de passe changé avec succès', {
        description: 'Vous pouvez maintenant accéder à votre compte',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Erreur lors du changement de mot de passe';
      toast.error('Échec du changement de mot de passe', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border border-gray-200 bg-white/95 backdrop-blur-md">
      <CardHeader className="pb-3 pt-5 text-center">
        <CardTitle className="text-xl font-bold text-gray-900 mb-1">
          Changement de mot de passe
        </CardTitle>
        {mustChange ? (
          <CardDescription className="text-sm font-medium text-orange-700 bg-orange-50 p-2 rounded-md">
            ⚠️ Vous devez changer votre mot de passe avant de continuer
          </CardDescription>
        ) : (
          <CardDescription className="text-sm text-gray-600">
            Créez un nouveau mot de passe sécurisé
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Mot de passe actuel */}
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
              Mot de passe actuel
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-10"
                {...register('currentPassword')}
                disabled={isSubmitting}
              />
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* Nouveau mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-10"
                {...register('newPassword')}
                disabled={isSubmitting}
              />
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-600">{errors.newPassword.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial
            </p>
          </div>

          {/* Confirmation du nouveau mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirmer le nouveau mot de passe
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-10"
                {...register('confirmPassword')}
                disabled={isSubmitting}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Bouton de soumission */}
          <Button
            type="submit"
            className="w-full h-10 bg-[#3B7DDD] hover:bg-[#2E6BC6] text-white font-medium mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Changement en cours...
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Changer le mot de passe
              </>
            )}
          </Button>

          {!mustChange && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
