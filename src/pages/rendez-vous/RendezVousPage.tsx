import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Search, Pencil, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useRendezVous, useUpdateStatutRendezVous, useDeleteRendezVous } from '@/lib/hooks/useRendezVous';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  STATUT_RDV_VALUES,
  STATUT_RDV_LABELS,
  STATUT_RDV_COLORS,
  formaterDateRendezVous,
  formaterDateCourte,
  formaterHeure,
  isRendezVousToday,
  isRendezVousPasse,
  getNomCompletPatient,
  getMatriculePatient,
  type StatutRendezVous,
  type RendezVous,
} from '@/types/rendez-vous';
import { toast } from 'sonner';

export function RendezVousPage() {
  const { isInfirmier } = useAuth();
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState<StatutRendezVous | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rendezVousToDelete, setRendezVousToDelete] = useState<RendezVous | null>(null);

  // Construire les filtres
  const filters = {
    search: debouncedSearch || undefined,
    statut: statut || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: pageSize,
  };

  // React Query hooks
  const { data, isLoading, isError, error } = useRendezVous(filters);
  const updateStatutMutation = useUpdateStatutRendezVous();
  const deleteMutation = useDeleteRendezVous();

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleChangeStatut = async (id: string, newStatut: StatutRendezVous) => {
    try {
      await updateStatutMutation.mutateAsync({ id, statut: newStatut });
      toast.success('Statut mis à jour avec succès');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteClick = (rdv: RendezVous) => {
    setRendezVousToDelete(rdv);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rendezVousToDelete) return;

    try {
      await deleteMutation.mutateAsync(rendezVousToDelete.id);
      toast.success('Rendez-vous supprimé avec succès');
      setDeleteDialogOpen(false);
      setRendezVousToDelete(null);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
            <Calendar className="h-5 w-5 md:h-8 md:w-8 text-blue-600" />
            {isInfirmier ? 'Gestion des Rendez-vous' : 'Mes Rendez-vous'}
          </h1>
          <div className="flex gap-2">
            <Link to="/rendez-vous">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Vue Calendrier</span>
                <span className="md:hidden">Calendrier</span>
              </Button>
            </Link>
            {isInfirmier && (
              <Link to="/rendez-vous/nouveau">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">Nouveau Rendez-vous</span>
                  <span className="md:hidden">Nouveau</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
        <p className="text-slate-600">
          {isInfirmier
            ? 'Planifier et gérer les rendez-vous médicaux'
            : 'Consulter vos rendez-vous médicaux'}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Statut filter */}
            <div className="flex gap-2">
              <Select
                value={statut || undefined}
                onValueChange={(value) => {
                  setStatut(value as StatutRendezVous);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-white flex-1">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {STATUT_RDV_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUT_RDV_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statut && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatut('');
                    setPage(1);
                  }}
                  className="px-3"
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Date début */}
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="bg-white"
            />

            {/* Date fin */}
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <p className="font-semibold">Erreur lors du chargement</p>
              <p className="text-sm mt-1">{error?.message || 'Une erreur est survenue'}</p>
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Calendar className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-semibold">Aucun rendez-vous trouvé</p>
              <p className="text-sm mt-1">
                {isInfirmier
                  ? 'Commencez par créer un nouveau rendez-vous'
                  : 'Aucun rendez-vous planifié pour le moment'}
              </p>
            </div>
          ) : (
            <>
              {/* Pagination Controls - Top */}
              <div className="flex flex-row items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-slate-100 overflow-x-auto whitespace-nowrap text-xs md:text-sm">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-700 font-semibold">
                      {data.total} rendez-vous au total
                    </p>
                    {data.totalPages > 1 && (
                      <>
                        <span className="text-slate-400">•</span>
                        <p className="text-slate-600">
                          Page {data.page} sur {data.totalPages}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-medium">Afficher</span>
                    <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-[70px] h-8 border-slate-300 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-slate-700 font-medium">par page</span>
                  </div>
                </div>

                {data.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="hidden sm:inline-flex bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                    >
                      Premier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>

                    {/* Numéros de page */}
                    <div className="hidden md:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                        let pageNum;
                        if (data.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= data.totalPages - 2) {
                          pageNum = data.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={page === pageNum
                              ? "w-9 bg-primary hover:bg-primary/90"
                              : "w-9 bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(data.totalPages)}
                      disabled={page === data.totalPages}
                      className="hidden sm:inline-flex bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                    >
                      Dernier
                    </Button>
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="whitespace-nowrap text-xs md:text-sm">
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Statut</TableHead>
                    {isInfirmier && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((rdv) => {
                    const isToday = isRendezVousToday(rdv.dateHeure);
                    const isPast = isRendezVousPasse(rdv.dateHeure);

                    return (
                      <TableRow key={rdv.id} className={isToday ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{formaterDateCourte(rdv.dateHeure)}</span>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formaterHeure(rdv.dateHeure)}
                            </span>
                            {isToday && (
                              <span className="text-xs font-semibold text-blue-600 mt-1">
                                Aujourd'hui
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{getNomCompletPatient(rdv)}</span>
                            <span className="text-sm text-slate-500">{getMatriculePatient(rdv)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="line-clamp-2 text-sm">{rdv.motif}</p>
                        </TableCell>
                        <TableCell>
                          {isInfirmier && !isPast ? (
                            <Select
                              value={rdv.statut}
                              onValueChange={(value) => handleChangeStatut(rdv.id, value as StatutRendezVous)}
                            >
                              <SelectTrigger
                                className={`w-32 text-xs font-semibold border ${STATUT_RDV_COLORS[rdv.statut]}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {STATUT_RDV_VALUES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {STATUT_RDV_LABELS[s]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${STATUT_RDV_COLORS[rdv.statut]}`}
                            >
                              {STATUT_RDV_LABELS[rdv.statut]}
                            </span>
                          )}
                        </TableCell>
                        {isInfirmier && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/rendez-vous/${rdv.id}`}>
                                <Button variant="ghost" size="icon" title="Voir détails">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link to={`/rendez-vous/${rdv.id}/modifier`}>
                                <Button variant="ghost" size="icon" title="Modifier">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Supprimer"
                                onClick={() => handleDeleteClick(rdv)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
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
                {rendezVousToDelete && getNomCompletPatient(rendezVousToDelete)}
              </span>{' '}
              prévu le{' '}
              <span className="font-semibold text-slate-900">
                {rendezVousToDelete && formaterDateRendezVous(rendezVousToDelete.dateHeure)}
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
              onClick={handleDeleteConfirm}
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
