import { Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicamentForm } from '@/components/medicaments/MedicamentForm';

export function NewMedicamentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Pill className="h-8 w-8 text-purple-600" />
          Nouveau Médicament
        </h1>
        <p className="text-slate-600 mt-1">
          Ajouter un nouveau médicament au catalogue
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du Médicament</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicamentForm />
        </CardContent>
      </Card>
    </div>
  );
}
