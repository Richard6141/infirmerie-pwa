import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Plus, Search, Pencil, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useMedicaments, useDeleteMedicament } from '@/lib/hooks/useMedicaments';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getStockStatus,
  getStockBadgeColor,
  getStockStatusLabel,
  FORME_GALENIQUE_VALUES,
  FORME_GALENIQUE_LABELS,
  type FormeGalenique,
} from '@/types/medicament';
import { toast } from 'sonner';

export function MedicamentsPage() {
  const { isInfirmier } = useAuth();
  const [search, setSearch] = useState('');
  const [forme, setForme] = useState<FormeGalenique | ''>('');
  const [stockBas, setStockBas] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Construire les filtres
  const filters = {
    search: debouncedSearch || undefined,
    forme: forme || undefined,
    stockBas: stockBas ? true : undefined,
    page,
    limit: pageSize,
  };

  // React Query hooks
  const { data, isLoading, isError, error } = useMedicaments(filters);

  const deleteMutation = useDeleteMedicament();

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Médicament supprimé avec succès');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
            <Pill className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            Catalogue Médicaments
          </h1>
          <p className="text-slate-600 mt-1">
            Gérer le catalogue des médicaments et suivre les stocks
          </p>
        </div>

        {isInfirmier && (
          <Link to="/medicaments/nouveau">
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4" />
              Nouveau Médicament
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par code, DCI ou nom commercial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Forme galénique filter */}
            <div className="flex gap-2">
              <Select
                value={forme || undefined}
                onValueChange={(value) => {
                  setForme(value as FormeGalenique);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-white flex-1">
                  <SelectValue placeholder="Toutes les formes" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {FORME_GALENIQUE_VALUES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORME_GALENIQUE_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {forme && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForme('');
                    setPage(1);
                  }}
                  className="px-3"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {/* Stock bas filter */}
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="stock-bas"
              checked={stockBas}
              onCheckedChange={(checked) => {
                setStockBas(!!checked);
                setPage(1);
              }}
            />
            <label
              htmlFor="stock-bas"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Afficher uniquement les médicaments à stock bas
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <p className="font-semibold">Erreur lors du chargement</p>
              <p className="text-sm mt-1">{error?.message || 'Une erreur est survenue'}</p>
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Pill className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-semibold">Aucun médicament trouvé</p>
            </div>
          ) : (
            <>
              {/* Pagination Controls - Top */}
              <div className="flex flex-row items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-slate-100 overflow-x-auto whitespace-nowrap text-xs md:text-sm">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-700 font-semibold">
                      {data.total} médicament{data.total > 1 ? 's' : ''} au total
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
                    <TableHead>Code</TableHead>
                    <TableHead>Nom Commercial</TableHead>
                    <TableHead>DCI</TableHead>
                    <TableHead>Forme</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    {isInfirmier && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((medicament) => {
                    const status = getStockStatus(medicament);
                    return (
                      <TableRow key={medicament.id}>
                        <TableCell className="font-medium font-mono text-sm">
                          {medicament.code}
                        </TableCell>
                        <TableCell className="font-medium">{medicament.nomCommercial}</TableCell>
                        <TableCell>{medicament.dci}</TableCell>
                        <TableCell>{FORME_GALENIQUE_LABELS[medicament.forme]}</TableCell>
                        <TableCell>{medicament.dosage}</TableCell>
                        <TableCell>
                          {medicament.stock ? (
                            <div className="text-sm">
                              <span className="font-medium">{medicament.stock.quantiteActuelle}</span>
                              <span className="text-slate-500"> / {medicament.stock.seuilMax}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Non géré</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStockBadgeColor(status)}`}>
                            {getStockStatusLabel(status)}
                          </span>
                        </TableCell>
                        {isInfirmier && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/medicaments/${medicament.id}`}>
                                <Button variant="ghost" size="icon" title="Voir détails">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link to={`/medicaments/${medicament.id}/modifier`}>
                                <Button variant="ghost" size="icon" title="Modifier">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Supprimer"
                                onClick={() => {
                                  if (window.confirm('Voulez-vous vraiment supprimer ce médicament ?')) {
                                    handleDelete(medicament.id);
                                  }
                                }}
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
    </div>
  );
}
