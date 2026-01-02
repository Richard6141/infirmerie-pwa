import { useParams } from 'react-router-dom';
import { Pill, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicamentForm } from '@/components/medicaments/MedicamentForm';
import { useMedicament } from '@/lib/hooks/useMedicaments';

export function EditMedicamentPage() {
  const { id } = useParams<{ id: string }>();
  const { data: medicament, isLoading, isError } = useMedicament(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isError || !medicament) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="font-semibold">Médicament introuvable</p>
        <p className="text-sm mt-1">Le médicament demandé n'existe pas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Pill className="h-8 w-8 text-purple-600" />
          Modifier le Médicament
        </h1>
        <p className="text-slate-600 mt-1">
          Modifier les informations du médicament
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du Médicament</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicamentForm medicament={medicament} />
        </CardContent>
      </Card>
    </div>
  );
}
