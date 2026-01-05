import { useParams } from 'react-router-dom';
import { FileHeart, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReposSanitaireForm } from '@/components/repos-sanitaire/ReposSanitaireForm';
import { useReposSanitaireDetail } from '@/lib/hooks/useReposSanitaire';

export function EditReposSanitairePage() {
  const { id } = useParams<{ id: string }>();
  const { data: reposSanitaire, isLoading, isError } = useReposSanitaireDetail(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    );
  }

  if (isError || !reposSanitaire) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="font-semibold">Fiche de repos sanitaire introuvable</p>
        <p className="text-sm mt-1">La fiche demandée n'existe pas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <FileHeart className="h-8 w-8 text-success" />
          Modifier la Fiche de Repos Sanitaire
        </h1>
        <p className="text-slate-600 mt-1">
          Modifier les informations de la fiche de repos sanitaire
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la Fiche de Repos</CardTitle>
        </CardHeader>
        <CardContent>
          <ReposSanitaireForm reposSanitaire={reposSanitaire} />
        </CardContent>
      </Card>
    </div>
  );
}
