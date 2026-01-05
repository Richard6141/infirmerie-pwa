import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConsultationForm } from '@/components/consultations/ConsultationForm';

export function NewConsultationPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
          <FileText className="h-5 w-5 md:h-8 md:w-8 text-success" />
          Nouvelle Consultation
        </h1>
        <p className="text-slate-600">
          Enregistrer une nouvelle consultation médicale
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la Consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <ConsultationForm />
        </CardContent>
      </Card>
    </div>
  );
}
