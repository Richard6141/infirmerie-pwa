import { useParams } from 'react-router-dom';
import { FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConsultationForm } from '@/components/consultations/ConsultationForm';
import { useConsultation } from '@/lib/hooks/useConsultations';

export function EditConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: consultation, isLoading, isError } = useConsultation(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    );
  }

  if (isError || !consultation) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="font-semibold">Consultation introuvable</p>
        <p className="text-sm mt-1">La consultation demandée n'existe pas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
          <FileText className="h-6 w-6 md:h-8 md:w-8 text-success" />
          Modifier la Consultation
        </h1>
        <p className="text-slate-600 mt-1">
          Modifier les informations de la consultation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la Consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <ConsultationForm consultation={consultation} />
        </CardContent>
      </Card>
    </div>
  );
}
