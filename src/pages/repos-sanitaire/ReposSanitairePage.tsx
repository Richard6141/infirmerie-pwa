import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileHeart, Plus, Search, Pencil, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, Calendar, FileDown } from 'lucide-react';
import { useReposSanitaire, useDeleteReposSanitaire } from '@/lib/hooks/useReposSanitaire';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formaterDateRepos,
  formaterDuree,
  type ReposSanitaire,
} from '@/types/repos-sanitaire';
import { generateReposSanitairePDF } from '@/lib/utils/generateReposSanitairePDF';
// TODO: Décommenter la ligne suivante une fois que le logo est placé dans src/assets/logo-mdc.png
// import logoMDC from '@/assets/logo-mdc.png';
import { toast } from 'sonner';

export function ReposSanitairePage() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reposSanitaireToDelete, setReposSanitaireToDelete] = useState<ReposSanitaire | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // React Query hooks
  const { data, isLoading, isError } = useReposSanitaire({
    search: debouncedSearch,
    startDate,
    endDate,
    page,
    limit: pageSize,
  });

  const deleteMutation = useDeleteReposSanitaire();

  // Debounce search with useEffect
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  // Delete handlers
  const handleDeleteClick = (reposSanitaire: ReposSanitaire) => {
    setReposSanitaireToDelete(reposSanitaire);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reposSanitaireToDelete) return;

    try {
      await deleteMutation.mutateAsync(reposSanitaireToDelete.id);
      toast.success('Fiche de repos sanitaire supprimée avec succès');
      setDeleteDialogOpen(false);
      setReposSanitaireToDelete(null);
    } catch (err) {
      toast.error('Erreur lors de la suppression de la fiche');
      console.error(err);
    }
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1); // Reset to first page when changing page size
  };

  const handleGeneratePDF = (repos: ReposSanitaire) => {
    try {
      // TODO: Une fois le logo importé, passer logoMDC comme second paramètre
      // generateReposSanitairePDF(repos, logoMDC);
      generateReposSanitairePDF(repos);
      toast.success('PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
      console.error(error);
    }
  };

  const paginatedData = data ?? {
    data: [],
    page: 1,
    total: 0,
    totalPages: 0,
  };

  const reposSanitaires = paginatedData.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
            <FileHeart className="h-6 w-6 md:h-8 md:w-8 text-success" />
            Repos Sanitaire
          </h1>
          <p className="text-slate-600 mt-1">
            Gérer et suivre les fiches de repos sanitaire des patients
          </p>
        </div>

        <Link to="/repos-sanitaire/nouvelle">
          <Button className="gap-2 bg-success hover:bg-success/90">
            <Plus className="h-4 w-4" />
            Nouvelle Fiche de Repos
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search by patient */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date filters */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                placeholder="Date début"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                placeholder="Date fin"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-success" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="font-semibold text-destructive">Erreur lors du chargement des fiches</p>
            </div>
          ) : reposSanitaires.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <FileHeart className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-semibold">Aucune fiche de repos trouvée</p>
              <p className="text-sm mt-1">
                Commencez par créer une nouvelle fiche de repos sanitaire
              </p>
            </div>
          ) : (
            <>
              {/* Pagination Controls - Top */}
              <div className="flex flex-row items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-slate-100 overflow-x-auto whitespace-nowrap text-xs md:text-sm">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-700 font-semibold">
                      {paginatedData.total} fiche{paginatedData.total > 1 ? 's' : ''} au total
                    </p>
                    {paginatedData.totalPages > 1 && (
                      <>
                        <span className="text-slate-400">•</span>
                        <p className="text-slate-600">
                          Page {paginatedData.page} sur {paginatedData.totalPages}
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

                {paginatedData.totalPages > 1 && (
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(paginatedData.totalPages, p + 1))}
                      disabled={page === paginatedData.totalPages}
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(paginatedData.totalPages)}
                      disabled={page === paginatedData.totalPages}
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
                    <TableHead>Date Examen</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Diagnostic</TableHead>
                    <TableHead>Durée Repos</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reposSanitaires.map((repos) => (
                    <TableRow key={repos.id}>
                      <TableCell className="font-medium">
                        {formaterDateRepos(repos.dateExamen)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{repos.nomPatient}</p>
                          <p className="text-xs text-slate-500">{repos.matriculePatient}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={repos.diagnosticFinal}>
                          {repos.diagnosticFinal}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-blue-700">
                          {formaterDuree(repos.dureeRepos)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {formaterDateRepos(repos.dateDebut)} - {formaterDateRepos(repos.dateFin)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Générer PDF"
                            onClick={() => handleGeneratePDF(repos)}
                          >
                            <FileDown className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Link to={`/repos-sanitaire/${repos.id}`}>
                            <Button variant="ghost" size="icon" title="Voir détails">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/repos-sanitaire/${repos.id}/modifier`}>
                            <Button variant="ghost" size="icon" title="Modifier">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer"
                            onClick={() => handleDeleteClick(repos)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-xl">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-600 text-base mt-2">
              Êtes-vous sûr de vouloir supprimer la fiche de repos sanitaire du{' '}
              <span className="font-semibold text-slate-900">
                {reposSanitaireToDelete && formaterDateRepos(reposSanitaireToDelete.dateExamen)}
              </span>{' '}
              pour le patient{' '}
              <span className="font-semibold text-slate-900">
                {reposSanitaireToDelete?.nomPatient}
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
