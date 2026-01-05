import { FileHeart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReposSanitaireForm } from '@/components/repos-sanitaire/ReposSanitaireForm';

export function NewReposSanitairePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
          <FileHeart className="h-6 w-6 md:h-8 md:w-8 text-success" />
          Nouvelle Fiche de Repos Sanitaire
        </h1>
        <p className="text-slate-600 mt-1">
          Créer une nouvelle fiche de repos sanitaire pour un patient
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la Fiche de Repos</CardTitle>
        </CardHeader>
        <CardContent>
          <ReposSanitaireForm />
        </CardContent>
      </Card>
    </div>
  );
}
