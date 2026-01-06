import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, Loader2, ArrowLeft, Pencil, Trash2, User, Calendar, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConsultation, useDeleteConsultation } from '@/lib/hooks/useConsultations';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  formaterDateConsultation,
  formaterTensionArterielle,
  calculerIMC,
  interpreterIMC,
} from '@/types/consultation';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInfirmier } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: consultation, isLoading, isError } = useConsultation(id);
  const deleteMutation = useDeleteConsultation();

  const handleDelete = async () => {
    if (!consultation) return;

    try {
      await deleteMutation.mutateAsync(consultation.id);
      toast.success('Consultation supprimée avec succès');
      navigate('/consultations');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

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

  const imc = calculerIMC(
    consultation.constantesVitales.poids,
    consultation.constantesVitales.taille
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
              <FileText className="h-5 w-5 md:h-8 md:w-8 text-success" />
              Détail de la Consultation
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-1 items-end">
          {isInfirmier && (
            <div className="flex gap-2">
              <Link to={`/consultations/${consultation.id}/modifier`}>
                <Button variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  <span className="hidden md:inline">Modifier</span>
                </Button>
              </Link>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:inline">Supprimer</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      <p className="text-slate-600 ml-14 md:ml-0 -mt-4">
        Consultation du {formaterDateConsultation(consultation.date)}
      </p>

      {/* Informations Patient et Infirmier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{consultation.nomPatient}</p>
              <p className="text-sm text-slate-600">Matricule: {consultation.matriculePatient}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Infirmier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{consultation.nomInfirmier}</p>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formaterDateConsultation(consultation.date)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motif */}
      <Card>
        <CardHeader>
          <CardTitle>Motif de Consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700">{consultation.motif}</p>
        </CardContent>
      </Card>

      {/* Constantes Vitales */}
      <Card>
        <CardHeader>
          <CardTitle>Constantes Vitales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {consultation.constantesVitales.temperature && (
              <div>
                <p className="text-sm text-slate-600">Température</p>
                <p className="text-lg font-semibold">
                  {consultation.constantesVitales.temperature}°C
                </p>
              </div>
            )}
            {consultation.constantesVitales.tensionSystolique &&
              consultation.constantesVitales.tensionDiastolique && (
                <div>
                  <p className="text-sm text-slate-600">Tension Artérielle</p>
                  <p className="text-lg font-semibold">
                    {formaterTensionArterielle(
                      consultation.constantesVitales.tensionSystolique,
                      consultation.constantesVitales.tensionDiastolique
                    )}
                  </p>
                </div>
              )}
            {consultation.constantesVitales.frequenceCardiaque && (
              <div>
                <p className="text-sm text-slate-600">Fréquence Cardiaque</p>
                <p className="text-lg font-semibold">
                  {consultation.constantesVitales.frequenceCardiaque} bpm
                </p>
              </div>
            )}
            {consultation.constantesVitales.saturationOxygene && (
              <div>
                <p className="text-sm text-slate-600">Saturation O₂</p>
                <p className="text-lg font-semibold">
                  {consultation.constantesVitales.saturationOxygene}%
                </p>
              </div>
            )}
            {consultation.constantesVitales.glycemie && (
              <div>
                <p className="text-sm text-slate-600">Glycémie</p>
                <p className="text-lg font-semibold">
                  {consultation.constantesVitales.glycemie} g/L
                </p>
              </div>
            )}
            {consultation.constantesVitales.poids && (
              <div>
                <p className="text-sm text-slate-600">Poids</p>
                <p className="text-lg font-semibold">{consultation.constantesVitales.poids} kg</p>
              </div>
            )}
            {consultation.constantesVitales.taille && (
              <div>
                <p className="text-sm text-slate-600">Taille</p>
                <p className="text-lg font-semibold">{consultation.constantesVitales.taille} cm</p>
              </div>
            )}
            {imc && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600">IMC</p>
                <p className="text-lg font-semibold">
                  {imc} - {interpreterIMC(imc)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Examen Clinique */}
      {consultation.examenClinique && (
        <Card>
          <CardHeader>
            <CardTitle>Examen Clinique</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{consultation.examenClinique}</p>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic */}
      {consultation.diagnostic && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{consultation.diagnostic}</p>
          </CardContent>
        </Card>
      )}

      {/* Observations */}
      {consultation.observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{consultation.observations}</p>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions */}
      {consultation.prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consultation.prescriptions.map((prescription, index) => (
                <div
                  key={prescription.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <Badge className="mt-1">{index + 1}</Badge>
                  <div className="flex-1">
                    <p className="font-semibold">{prescription.medicament?.nomCommercial}</p>
                    <p className="text-sm text-slate-600">
                      Posologie: {prescription.posologie}
                    </p>
                    <p className="text-sm text-slate-600">Durée: {prescription.duree}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prochain RDV */}
      {consultation.prochainRDV && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prochain Rendez-vous
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formaterDateConsultation(consultation.prochainRDV)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-xl">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-600 text-base mt-2">
              Êtes-vous sûr de vouloir supprimer cette consultation ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
