import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileHeart, Loader2, ArrowLeft, Pencil, Trash2, User, Calendar, FileDown, Stethoscope, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReposSanitaireDetail, useDeleteReposSanitaire } from '@/lib/hooks/useReposSanitaire';
import {
  formaterDateRepos,
  formaterDuree,
} from '@/types/repos-sanitaire';
import { generateReposSanitairePDF } from '@/lib/utils/generateReposSanitairePDF';
// TODO: Décommenter la ligne suivante une fois que le logo est placé dans src/assets/logo-mdc.png
// import logoMDC from '@/assets/logo-mdc.png';
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

export function ReposSanitaireDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: reposSanitaire, isLoading, isError } = useReposSanitaireDetail(id!);
  const deleteMutation = useDeleteReposSanitaire();

  const handleDelete = async () => {
    if (!reposSanitaire) return;

    try {
      await deleteMutation.mutateAsync(reposSanitaire.id);
      toast.success('Fiche de repos sanitaire supprimée avec succès');
      navigate('/repos-sanitaire');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleGeneratePDF = () => {
    if (!reposSanitaire) return;

    try {
      generateReposSanitairePDF(reposSanitaire);
      toast.success('PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    );
  }

  if (isError || !reposSanitaire) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="font-semibold">Fiche de repos sanitaire introuvable</p>
        <p className="text-sm mt-1">La fiche demandée n'existe pas</p>
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
              <FileHeart className="h-6 w-6 md:h-8 md:w-8 text-success" />
              Fiche de Repos Sanitaire
            </h1>
            <p className="text-slate-600 mt-1">
              Examen du {formaterDateRepos(reposSanitaire.dateExamen)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Prominent PDF Button */}
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={handleGeneratePDF}
          >
            <FileDown className="h-4 w-4" />
            Générer le PDF
          </Button>
          <Link to={`/repos-sanitaire/${reposSanitaire.id}/modifier`}>
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
      </div>

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
              <p className="text-lg font-semibold">{reposSanitaire.nomPatient}</p>
              <p className="text-sm text-slate-600">Matricule: {reposSanitaire.matriculePatient}</p>
              <p className="text-sm text-slate-600">Sexe: {reposSanitaire.sexePatient}</p>
              <p className="text-sm text-slate-600">Âge: {reposSanitaire.agePatient} ans</p>
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
              <p className="text-lg font-semibold">{reposSanitaire.nomInfirmier}</p>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Examen du {formaterDateRepos(reposSanitaire.dateExamen)}
              </p>
              <p className="text-sm text-slate-600">
                Lieu: {reposSanitaire.lieuRedaction}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Final</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap">{reposSanitaire.diagnosticFinal}</p>
        </CardContent>
      </Card>

      {/* Soins Institués */}
      <Card>
        <CardHeader>
          <CardTitle>Soins Institués</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap">{reposSanitaire.soinsInstitues}</p>
        </CardContent>
      </Card>

      {/* Repos Physique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Repos Physique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-base px-4 py-2 bg-blue-50 text-blue-700 border-blue-300">
                Durée: {formaterDuree(reposSanitaire.dureeRepos)}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Date de début</p>
                <p className="text-lg font-semibold text-slate-800">
                  {formaterDateRepos(reposSanitaire.dateDebut)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Date de fin</p>
                <p className="text-lg font-semibold text-slate-800">
                  {formaterDateRepos(reposSanitaire.dateFin)}
                </p>
              </div>
            </div>
            {reposSanitaire.dateControle && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800">Date de contrôle physique</p>
                <p className="text-lg font-semibold text-amber-900 mt-1">
                  {formaterDateRepos(reposSanitaire.dateControle)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métadonnées */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">Métadonnées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
            <p>Créé le: {new Date(reposSanitaire.createdAt).toLocaleString('fr-FR')}</p>
            <p>Modifié le: {new Date(reposSanitaire.updatedAt).toLocaleString('fr-FR')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-xl">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-600 text-base mt-2">
              Êtes-vous sûr de vouloir supprimer cette fiche de repos sanitaire pour{' '}
              <span className="font-semibold text-slate-900">
                {reposSanitaire.nomPatient}
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
