import { useParams } from 'react-router-dom';
import { Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RendezVousForm } from '@/components/rendez-vous/RendezVousForm';
import { useRendezVousDetail } from '@/lib/hooks/useRendezVous';

export function EditRendezVousPage() {
  const { id } = useParams<{ id: string }>();
  const { data: rendezVous, isLoading, isError } = useRendezVousDetail(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !rendezVous) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="font-semibold">Rendez-vous introuvable</p>
        <p className="text-sm mt-1">Le rendez-vous demandé n'existe pas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
          <Calendar className="h-5 w-5 md:h-8 md:w-8 text-blue-600" />
          Modifier le Rendez-vous
        </h1>
        <p className="text-slate-600">
          Modifier les informations du rendez-vous
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du Rendez-vous</CardTitle>
        </CardHeader>
        <CardContent>
          <RendezVousForm rendezVous={rendezVous} />
        </CardContent>
      </Card>
    </div>
  );
}
