import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Pencil, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useConsultations, useMyConsultations, useDeleteConsultation } from '@/lib/hooks/useConsultations';
import { useAuth } from '@/lib/hooks/useAuth';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formaterDateConsultation,
  formaterConstantesVitales,
  type Consultation,
} from '@/types/consultation';
import { toast } from 'sonner';

export function ConsultationsPage() {
  const { isInfirmier } = useAuth();

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<Consultation | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // React Query hooks - different hooks based on user role
  const consultationsQuery = useConsultations(
    isInfirmier
      ? {
          search: debouncedSearch, // Recherche par nom de patient
          startDate,
          endDate,
          page,
          limit: 20,
        }
      : {}
  );

  const myConsultationsQuery = useMyConsultations();

  // Use the appropriate query based on role
  const { data, isLoading, isError, error } = isInfirmier ? consultationsQuery : myConsultationsQuery;

  const deleteMutation = useDeleteConsultation();

  // Debounce search with useEffect
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  // Delete handlers
  const handleDeleteClick = (consultation: Consultation) => {
    setConsultationToDelete(consultation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!consultationToDelete) return;

    try {
      await deleteMutation.mutateAsync(consultationToDelete.id);
      toast.success('Consultation supprimée avec succès');
      setDeleteDialogOpen(false);
      setConsultationToDelete(null);
    } catch (err) {
      toast.error('Erreur lors de la suppression de la consultation');
      console.error(err);
    }
  };

  // For patient view, transform array response to paginated format
  const paginatedData: { data: Consultation[], page: number, total: number, totalPages: number } | undefined = !isInfirmier && data
    ? {
        data: Array.isArray(data) ? data : [],
        page: 1,
        total: Array.isArray(data) ? data.length : 0,
        totalPages: 1,
      }
    : (data as { data: Consultation[], page: number, total: number, totalPages: number } | undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="h-8 w-8 text-success" />
            {isInfirmier ? 'Consultations' : 'Mes Consultations'}
          </h1>
          <p className="text-slate-600 mt-1">
            {isInfirmier
              ? 'Gérer et suivre toutes les consultations médicales'
              : 'Consulter votre historique médical'}
          </p>
        </div>

        {isInfirmier && (
          <Link to="/consultations/nouvelle">
            <Button className="gap-2 bg-success hover:bg-success/90">
              <Plus className="h-4 w-4" />
              Nouvelle Consultation
            </Button>
          </Link>
        )}
      </div>

      {/* Filters & Search */}
      {isInfirmier && (
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
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-success" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              {!isInfirmier && error?.message?.includes('Profil patient non trouvé') ? (
                <>
                  <FileText className="h-12 w-12 mb-3 text-orange-300" />
                  <p className="font-semibold text-orange-700">Profil patient non configuré</p>
                  <p className="text-sm mt-2 text-slate-600 text-center max-w-md">
                    Votre compte utilisateur n'est pas encore lié à un profil patient.
                    Veuillez contacter un infirmier pour créer votre dossier patient.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-destructive">Erreur lors du chargement des consultations</p>
                  <p className="text-sm mt-1 text-destructive">{error?.message}</p>
                </>
              )}
            </div>
          ) : !paginatedData || paginatedData.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-semibold">Aucune consultation trouvée</p>
              <p className="text-sm mt-1">
                {isInfirmier
                  ? 'Commencez par créer une nouvelle consultation'
                  : 'Aucune consultation enregistrée pour le moment'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {isInfirmier && <TableHead>Patient</TableHead>}
                    {!isInfirmier && <TableHead>Infirmier</TableHead>}
                    <TableHead>Motif</TableHead>
                    <TableHead>Constantes Vitales</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.data.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell className="font-medium">
                        {formaterDateConsultation(consultation.date)}
                      </TableCell>
                      {isInfirmier && (
                        <TableCell>
                          <div>
                            <p className="font-medium">{consultation.nomPatient}</p>
                            <p className="text-xs text-slate-500">{consultation.matriculePatient}</p>
                          </div>
                        </TableCell>
                      )}
                      {!isInfirmier && (
                        <TableCell>{consultation.nomInfirmier}</TableCell>
                      )}
                      <TableCell>
                        <div className="max-w-xs truncate" title={consultation.motif}>
                          {consultation.motif}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {formaterConstantesVitales(consultation.constantesVitales)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/consultations/${consultation.id}`}>
                            <Button variant="ghost" size="icon" title="Voir détails">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {isInfirmier && (
                            <>
                              <Link to={`/consultations/${consultation.id}/modifier`}>
                                <Button variant="ghost" size="icon" title="Modifier">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Supprimer"
                                onClick={() => handleDeleteClick(consultation)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination - Only for infirmier (patient view has all data) */}
              {isInfirmier && paginatedData.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-600 font-medium">
                      {paginatedData.total} consultation{paginatedData.total > 1 ? 's' : ''} au total
                    </p>
                    <span className="text-sm text-slate-400">•</span>
                    <p className="text-sm text-slate-500">
                      Page {paginatedData.page} sur {paginatedData.totalPages}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="hidden sm:inline-flex"
                    >
                      Premier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden md:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                        let pageNum;
                        if (paginatedData.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= paginatedData.totalPages - 2) {
                          pageNum = paginatedData.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-9"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(paginatedData.totalPages, p + 1))}
                      disabled={page === paginatedData.totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(paginatedData.totalPages)}
                      disabled={page === paginatedData.totalPages}
                      className="hidden sm:inline-flex"
                    >
                      Dernier
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {isInfirmier && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-slate-900 text-xl">Confirmer la suppression</DialogTitle>
              <DialogDescription className="text-slate-600 text-base mt-2">
                Êtes-vous sûr de vouloir supprimer la consultation du{' '}
                <span className="font-semibold text-slate-900">
                  {consultationToDelete && formaterDateConsultation(consultationToDelete.date)}
                </span>{' '}
                pour le patient{' '}
                <span className="font-semibold text-slate-900">
                  {consultationToDelete?.nomPatient}
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
      )}
    </div>
  );
}
