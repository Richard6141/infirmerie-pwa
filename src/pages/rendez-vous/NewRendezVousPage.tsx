import { Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RendezVousForm } from '@/components/rendez-vous/RendezVousForm';

export function NewRendezVousPage() {
  const [searchParams] = useSearchParams();
  const dateFromUrl = searchParams.get('date');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
          <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          Nouveau Rendez-vous
        </h1>
        <p className="text-slate-600 mt-1">
          Planifier un nouveau rendez-vous médical
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du Rendez-vous</CardTitle>
        </CardHeader>
        <CardContent>
          <RendezVousForm initialDate={dateFromUrl || undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
