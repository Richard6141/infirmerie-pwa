import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pill, Loader2, ArrowLeft, Pencil, Trash2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMedicament, useDeleteMedicament } from '@/lib/hooks/useMedicaments';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getStockStatus,
  getStockBadgeColor,
  getStockStatusLabel,
  FORME_GALENIQUE_LABELS,
} from '@/types/medicament';
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

export function MedicamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInfirmier } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: medicament, isLoading, isError } = useMedicament(id);
  const deleteMutation = useDeleteMedicament();

  const handleDelete = async () => {
    if (!medicament) return;

    try {
      await deleteMutation.mutateAsync(medicament.id);
      toast.success('Médicament supprimé avec succès');
      navigate('/medicaments');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isError || !medicament) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="font-semibold">Médicament introuvable</p>
        <p className="text-sm mt-1">Le médicament demandé n'existe pas</p>
      </div>
    );
  }

  const status = getStockStatus(medicament);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
              <Pill className="h-5 w-5 md:h-8 md:w-8 text-purple-600" />
              Détail du Médicament
            </h1>
          </div>

          {isInfirmier && (
            <div className="flex gap-2">
              <Link to={`/medicaments/${medicament.id}/modifier`}>
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
        <p className="text-slate-600 ml-14 md:ml-0">
          {medicament.nomCommercial}
        </p>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600">Code</p>
              <p className="text-lg font-semibold font-mono">{medicament.code}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Forme galénique</p>
              <p className="text-lg font-semibold">{FORME_GALENIQUE_LABELS[medicament.forme]}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">DCI</p>
              <p className="text-lg font-semibold">{medicament.dci}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Nom Commercial</p>
              <p className="text-lg font-semibold">{medicament.nomCommercial}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-600">Dosage</p>
              <p className="text-lg font-semibold">{medicament.dosage}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations de stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informations de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicament.stock ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-600">Statut</p>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold mt-1 ${getStockBadgeColor(status)}`}>
                    {getStockStatusLabel(status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-slate-600">Quantité actuelle</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {medicament.stock.quantiteActuelle}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Seuil minimum</p>
                  <p className="text-lg font-semibold">{medicament.stock.seuilMin}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Seuil maximum</p>
                  <p className="text-lg font-semibold">{medicament.stock.seuilMax}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Stock de sécurité</p>
                  <p className="text-lg font-semibold">{medicament.stock.stockSecurite}</p>
                </div>
              </div>

              {isInfirmier && (
                <div className="pt-4 border-t">
                  <Link to={`/stocks?medicament=${medicament.id}`}>
                    <Button variant="outline" className="gap-2">
                      <Package className="h-4 w-4" />
                      Gérer les entrées/sorties
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">
                La gestion du stock n'est pas activée pour ce médicament.
              </p>
              {isInfirmier && (
                <Link to={`/medicaments/${medicament.id}/modifier`}>
                  <Button variant="outline" className="mt-4">
                    Activer la gestion du stock
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-xl">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-600 text-base mt-2">
              Êtes-vous sûr de vouloir supprimer le médicament{' '}
              <span className="font-semibold text-slate-900">
                {medicament.nomCommercial}
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
