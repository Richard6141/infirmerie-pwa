import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConsultationForm } from '@/components/consultations/ConsultationForm';

export function NewConsultationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <FileText className="h-8 w-8 text-success" />
          Nouvelle Consultation
        </h1>
        <p className="text-slate-600 mt-1">
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
