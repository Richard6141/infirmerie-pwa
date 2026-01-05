import { ArrowLeft, UserCircle, Edit, FileText, Syringe, Calendar, Printer, Loader2, Activity, Eye } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePatient } from '@/lib/hooks/usePatients';
import { useSuiviConstantesByPatient, useEvolutionConstantes } from '@/lib/hooks/useSuiviConstantes';
import { SuiviConstantesCharts } from '@/pages/suivi-constantes/components/SuiviConstantesCharts';
import { getPatientAge, getPatientFullName } from '@/types/patient';
import {
  formatDatePrise,
  getCouleurTension,
  getCouleurGlycemie,
  getCouleurIMC
} from '@/types/suivi-constantes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading, isError } = usePatient(id);
  const { data: constantes } = useSuiviConstantesByPatient(id);
  const { data: evolution } = useEvolutionConstantes(id);

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
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="constantes" className="gap-2">
            <Activity className="h-4 w-4" />
            Constantes
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

        <TabsContent value="constantes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des Constantes</CardTitle>
              <div className="flex gap-2">
                {constantes && constantes.length > 0 && (
                  <Link to={`/suivi-constantes/${constantes[0].id}`}>
                    <Button variant="outline" className="gap-2">
                      <Activity className="h-4 w-4" />
                      Voir évolution
                    </Button>
                  </Link>
                )}
                <Link to={`/suivi-constantes/nouveau?patientId=${patient.id}`}>
                  <Button className="gap-2">
                    <Activity className="h-4 w-4" />
                    Nouvelle Prise
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {/* Graphiques d'évolution */}
              {evolution && <SuiviConstantesCharts evolution={evolution} />}

              {/* Tableau historique */}
              {!constantes || !Array.isArray(constantes) || constantes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">Aucune prise de constantes</p>
                  <p className="text-sm mt-1">
                    Les relevés de constantes de ce patient apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Tension</TableHead>
                        <TableHead>Glycémie</TableHead>
                        <TableHead>IMC</TableHead>
                        <TableHead>Temp.</TableHead>
                        <TableHead>SpO₂</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {constantes.slice(0, 5).map((constante) => (
                        <TableRow key={constante.id}>
                          <TableCell className="font-medium">
                            {formatDatePrise(constante.datePrise)}
                          </TableCell>
                          <TableCell>
                            {constante.tensionSystolique ? (
                              <div>
                                <span className="font-medium">
                                  {constante.tensionSystolique}/{constante.tensionDiastolique}
                                </span>
                                {constante.classificationTension && (
                                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border ${getCouleurTension(constante.classificationTension)}`}>
                                    {constante.classificationTension}
                                  </span>
                                )}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {constante.glycemie ? (
                              <div>
                                <span className="font-medium">{constante.glycemie}</span>
                                {constante.classificationGlycemie && (
                                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border ${getCouleurGlycemie(constante.classificationGlycemie)}`}>
                                    {constante.classificationGlycemie}
                                  </span>
                                )}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {constante.imc ? (
                              <div>
                                <span className="font-medium">{constante.imc}</span>
                                {constante.classificationIMC && (
                                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border ${getCouleurIMC(constante.classificationIMC)}`}>
                                    {constante.classificationIMC}
                                  </span>
                                )}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{constante.temperature ? `${constante.temperature}°C` : '-'}</TableCell>
                          <TableCell>{constante.saturationOxygene ? `${constante.saturationOxygene}%` : '-'}</TableCell>
                          <TableCell className="text-right">
                            <Link to={`/suivi-constantes/${constante.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {constantes.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link to={`/suivi-constantes?patientId=${patient.id}`}>
                        <Button variant="link">Voir tout l'historique</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
