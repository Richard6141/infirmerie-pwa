import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Loader2, ArrowLeft, Pencil, Trash2, User, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRendezVousDetail, useDeleteRendezVous } from '@/lib/hooks/useRendezVous';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  formaterDateRendezVous,
  formaterDateCourte,
  formaterHeure,
  getNomCompletPatient,
  getNomCompletInfirmier,
  getMatriculePatient,
  getObservations,
  STATUT_RDV_LABELS,
  STATUT_RDV_COLORS,
} from '@/types/rendez-vous';
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

export function RendezVousDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInfirmier } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: rendezVous, isLoading, isError } = useRendezVousDetail(id);
  const deleteMutation = useDeleteRendezVous();

  const handleDelete = async () => {
    if (!rendezVous) return;

    try {
      await deleteMutation.mutateAsync(rendezVous.id);
      toast.success('Rendez-vous supprimé avec succès');
      navigate('/rendez-vous');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !rendezVous) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="font-semibold">Rendez-vous introuvable</p>
        <p className="text-sm mt-1">Le rendez-vous demandé n'existe pas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              Détail du Rendez-vous
            </h1>
            <p className="text-slate-600 mt-1">
              {formaterDateRendezVous(rendezVous.dateHeure)}
            </p>
          </div>
        </div>

        {isInfirmier && (
          <div className="flex gap-2">
            <Link to={`/rendez-vous/${rendezVous.id}/modifier`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
            </Link>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        )}
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{getNomCompletPatient(rendezVous)}</p>
              <p className="text-sm text-slate-600">Matricule: {getMatriculePatient(rendezVous)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Date et Heure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Date et Heure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{formaterDateCourte(rendezVous.dateHeure)}</p>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formaterHeure(rendezVous.dateHeure)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statut */}
      <Card>
        <CardHeader>
          <CardTitle>Statut</CardTitle>
        </CardHeader>
        <CardContent>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border ${STATUT_RDV_COLORS[rendezVous.statut]}`}
          >
            {STATUT_RDV_LABELS[rendezVous.statut]}
          </span>
        </CardContent>
      </Card>

      {/* Motif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Motif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap">{rendezVous.motif}</p>
        </CardContent>
      </Card>

      {/* Observations */}
      {getObservations(rendezVous) && (
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{getObservations(rendezVous)}</p>
          </CardContent>
        </Card>
      )}

      {/* Infirmier */}
      <Card>
        <CardHeader>
          <CardTitle>Infirmier</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{getNomCompletInfirmier(rendezVous)}</p>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-xl">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-600 text-base mt-2">
              Êtes-vous sûr de vouloir supprimer le rendez-vous avec{' '}
              <span className="font-semibold text-slate-900">
                {getNomCompletPatient(rendezVous)}
              </span>{' '}
              prévu le{' '}
              <span className="font-semibold text-slate-900">
                {formaterDateRendezVous(rendezVous.dateHeure)}
              </span>{' '}
              ? Cette action est irréversible.
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
