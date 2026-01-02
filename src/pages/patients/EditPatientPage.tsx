import { ArrowLeft, UserPen, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientForm } from '@/components/patients/PatientForm';
import { usePatient } from '@/lib/hooks/usePatients';

export function EditPatientPage() {
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading, isError } = usePatient(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-destructive">Patient introuvable</h1>
            <p className="text-slate-600 mt-1">
              Le patient demandé n'existe pas ou a été supprimé.
            </p>
          </div>
        </div>
        <Link to="/patients">
          <Button>Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <UserPen className="h-8 w-8 text-primary" />
            Modifier Patient
          </h1>
          <p className="text-slate-600 mt-1">
            {patient.prenom} {patient.nom} - {patient.matricule}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm patient={patient} />
        </CardContent>
      </Card>
    </div>
  );
}
