import { ArrowLeft, UserCircle, Edit, FileText, Syringe, Calendar, Printer, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePatient } from '@/lib/hooks/usePatients';
import { getPatientAge, getPatientFullName } from '@/types/patient';

export function PatientDetailPage() {
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

  const fullName = getPatientFullName(patient);
  const age = getPatientAge(patient);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <UserCircle className="h-8 w-8 text-primary" />
              {fullName}
            </h1>
            <p className="text-slate-600 mt-1">
              {patient.matricule} • {age} ans • {patient.sexe}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/patients/${patient.id}/modifier`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </Link>
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Informations Personnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
              <p className="text-base text-slate-800">{patient.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Téléphone</p>
              <p className="text-base text-slate-800">{patient.telephone}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Date de Naissance</p>
              <p className="text-base text-slate-800">
                {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Direction</p>
              <p className="text-base text-slate-800">{patient.direction}</p>
            </div>

            {patient.service && (
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Service</p>
                <p className="text-base text-slate-800">{patient.service}</p>
              </div>
            )}

            {patient.groupeSanguin && (
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Groupe Sanguin</p>
                <Badge variant="outline" className="text-base font-semibold">
                  {patient.groupeSanguin}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations Médicales */}
      {(patient.allergies || patient.antecedentsMedicaux) && (
        <Card>
          <CardHeader>
            <CardTitle>Informations Médicales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.allergies && (
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.split(',').map((allergie, index) => (
                    <Badge key={index} variant="destructive">
                      {allergie.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {patient.antecedentsMedicaux && (
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Antécédents Médicaux</p>
                <p className="text-base text-slate-700 whitespace-pre-wrap">
                  {patient.antecedentsMedicaux}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Onglets */}
      <Tabs defaultValue="consultations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consultations" className="gap-2">
            <FileText className="h-4 w-4" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="gap-2">
            <Syringe className="h-4 w-4" />
            Vaccinations
          </TabsTrigger>
          <TabsTrigger value="rendez-vous" className="gap-2">
            <Calendar className="h-4 w-4" />
            Rendez-vous
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des Consultations</CardTitle>
              <Link to={`/consultations/nouveau?patient=${patient.id}`}>
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  Nouvelle Consultation
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">Aucune consultation</p>
                <p className="text-sm mt-1">
                  Les consultations de ce patient apparaîtront ici
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Carnet de Vaccination</CardTitle>
              <Link to={`/vaccinations/nouveau?patient=${patient.id}`}>
                <Button className="gap-2">
                  <Syringe className="h-4 w-4" />
                  Nouveau Vaccin
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Syringe className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">Aucune vaccination</p>
                <p className="text-sm mt-1">
                  Les vaccinations de ce patient apparaîtront ici
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rendez-vous" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rendez-vous à venir</CardTitle>
              <Link to={`/rendez-vous/nouveau?patient=${patient.id}`}>
                <Button className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Nouveau RDV
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">Aucun rendez-vous</p>
                <p className="text-sm mt-1">
                  Les rendez-vous de ce patient apparaîtront ici
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
