import { useState } from 'react';
import { Package, Plus, AlertTriangle, TrendingUp, TrendingDown, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStocks, useMouvementsStock, useCreateMouvementStock } from '@/lib/hooks/useStocks';
import { useMedicaments } from '@/lib/hooks/useMedicaments';
import { getStatutStock, getStockPercentage, getStockGaugeColor, STATUT_STOCK_LABELS, STATUT_STOCK_COLORS, TYPE_MOUVEMENT_LABELS } from '@/types/stock';
import type { StatutStock, TypeMouvement } from '@/types/stock';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatMedicamentDisplay } from '@/types/medicament';

export function StocksPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutStock | 'ALERTE' | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);

  const { data, isLoading } = useStocks({
    search: search || undefined,
    statut: statutFilter || undefined,
    page,
    limit: pageSize,
  });

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
            <Package className="h-5 w-5 md:h-8 md:w-8 text-blue-600" />
            Gestion des Stocks
          </h1>

          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Nouveau Mouvement</span>
                <span className="md:hidden">Nouveau</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Enregistrer un mouvement de stock</DialogTitle>
              </DialogHeader>
              <MouvementForm onClose={() => setIsMovementDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Rechercher un médicament..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={statutFilter || undefined} onValueChange={(value) => setStatutFilter(value as any)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="ALERTE">⚠️ Alertes (Rupture + Bas)</SelectItem>
                  <SelectItem value="RUPTURE">Rupture de stock</SelectItem>
                  <SelectItem value="CRITIQUE">Stock critique</SelectItem>
                  <SelectItem value="BAS">Stock bas</SelectItem>
                  <SelectItem value="NORMAL">Stock normal</SelectItem>
                  <SelectItem value="HAUT">Stock élevé</SelectItem>
                </SelectContent>
              </Select>
              {statutFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatutFilter('')}
                  className="px-3"
                >
                  ✕
                </Button>
              )}
            </div>

            <Button variant="outline" onClick={() => { setSearch(''); setStatutFilter(''); }}>
              <Filter className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau stocks */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Aucun stock trouvé
            </div>
          ) : (
            <>
              {/* Pagination Controls - Top */}
              <div className="flex flex-row items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-slate-100 overflow-x-auto whitespace-nowrap text-xs md:text-sm">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-700 font-semibold">
                      {data.pagination?.total || data.data.length} stock{(data.pagination?.total || data.data.length) > 1 ? 's' : ''} au total
                    </p>
                    {data.pagination && data.pagination.totalPages > 1 && (
                      <>
                        <span className="text-slate-400">•</span>
                        <p className="text-slate-600">
                          Page {data.pagination.page} sur {data.pagination.totalPages}
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

                {data.pagination && data.pagination.totalPages > 1 && (
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
                      {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (data.pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= data.pagination.totalPages - 2) {
                          pageNum = data.pagination.totalPages - 4 + i;
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
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page >= data.pagination.totalPages}
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(data.pagination.totalPages)}
                      disabled={page >= data.pagination.totalPages}
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
                    <TableHead>Médicament</TableHead>
                    <TableHead>Forme</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Jauge</TableHead>
                    <TableHead>Seuils</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((stock) => {
                    const statut = getStatutStock(
                      stock.quantiteActuelle,
                      stock.seuilMin,
                      stock.seuilMax,
                      stock.stockSecurite
                    );
                    const percentage = getStockPercentage(stock.quantiteActuelle, stock.seuilMax);

                    return (
                      <TableRow key={stock.medicamentId}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {stock.medicament.nomCommercial}
                            </p>
                            <p className="text-sm text-slate-500">
                              {stock.medicament.dci} • {stock.medicament.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {stock.medicament.formeGalenique}
                            {stock.medicament.dosage && ` • ${stock.medicament.dosage}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-bold text-slate-800">
                            {stock.quantiteActuelle}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getStockGaugeColor(statut)} transition-all`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{Math.round(percentage)}%</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-600">
                            <p>Min: {stock.seuilMin}</p>
                            <p>Max: {stock.seuilMax}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUT_STOCK_COLORS[statut]}>
                            {statut === 'RUPTURE' || statut === 'CRITIQUE' ? (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            ) : null}
                            {STATUT_STOCK_LABELS[statut]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <HistoriqueMouvements />
    </div>
  );
}

function MouvementForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<TypeMouvement>('ENTREE');
  const [medicamentId, setMedicamentId] = useState('');
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');
  const [numeroLot, setNumeroLot] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');

  // État local pour la recherche de médicament
  const [medicamentSearch, setMedicamentSearch] = useState('');

  const { data: medicaments, isLoading: isMedicamentsLoading } = useMedicaments({
    search: medicamentSearch,
    limit: 20
  });
  const createMutation = useCreateMouvementStock();

  // Convertir les données en options pour le combobox
  const medicamentOptions: ComboboxOption[] = medicaments?.data.map(med => ({
    value: med.id,
    label: formatMedicamentDisplay(med),
    description: `Code: ${med.code} - ${med.formeGalenique}`,
  })) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!medicamentId || !quantite) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createMutation.mutateAsync({
        medicamentId,
        type,
        quantite: parseInt(quantite),
        motif: motif || undefined,
        numeroLot: numeroLot || undefined,
        dateExpiration: dateExpiration ? new Date(dateExpiration).toISOString() : undefined,
      });

      toast.success('Mouvement enregistré avec succès');
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Type de mouvement</Label>
        <Select value={type} onValueChange={(value) => setType(value as TypeMouvement)}>
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="ENTREE">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Entrée de stock
              </div>
            </SelectItem>
            <SelectItem value="SORTIE">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Sortie de stock
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Médicament *</Label>
        <Combobox
          options={medicamentOptions}
          value={medicamentId}
          onValueChange={setMedicamentId}
          onSearchChange={setMedicamentSearch}
          placeholder="Sélectionner un médicament"
          searchPlaceholder="Rechercher un médicament..."
          isLoading={isMedicamentsLoading}
        />
      </div>

      <div>
        <Label>Quantité *</Label>
        <Input
          type="number"
          min="1"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          placeholder="Ex: 50"
          className="bg-white"
        />
      </div>

      {type === 'ENTREE' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Numéro de lot</Label>
            <Input
              value={numeroLot}
              onChange={(e) => setNumeroLot(e.target.value)}
              placeholder="Ex: LOT2025-001"
              className="bg-white"
            />
          </div>
          <div>
            <Label>Date d'expiration</Label>
            <Input
              type="date"
              value={dateExpiration}
              onChange={(e) => setDateExpiration(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>
      )}

      <div>
        <Label>Motif</Label>
        <Textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          placeholder={type === 'ENTREE' ? 'Ex: Livraison fournisseur' : 'Ex: Distribution aux patients'}
          className="bg-white"
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>
    </form>
  );
}

function HistoriqueMouvements() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TypeMouvement | 'ALL'>('ALL');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const { data, isLoading, isError } = useMouvementsStock({
    page,
    limit: 10,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    startDate: dateDebut || undefined,
    endDate: dateFin || undefined,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des mouvements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-48">
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as TypeMouvement | 'ALL');
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Type de mouvement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                <SelectItem value="ENTREE">Entrées</SelectItem>
                <SelectItem value="SORTIE">Sorties</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              type="date"
              value={dateDebut}
              onChange={(e) => {
                setDateDebut(e.target.value);
                setPage(1);
              }}
              className="bg-white w-auto"
            />
            <Input
              type="date"
              value={dateFin}
              onChange={(e) => {
                setDateFin(e.target.value);
                setPage(1);
              }}
              className="bg-white w-auto"
            />
          </div>

          {(typeFilter !== 'ALL' || dateDebut || dateFin) && (
            <Button
              variant="outline"
              onClick={() => {
                setTypeFilter('ALL');
                setDateDebut('');
                setDateFin('');
                setPage(1);
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <div className="text-center py-6 text-red-500">
            Une erreur est survenue lors du chargement de l'historique.
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="font-medium">Aucun mouvement trouvé</p>
            <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.data.map((mouvement: any) => (
                <div key={mouvement.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${mouvement.type === 'ENTREE' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {mouvement.type === 'ENTREE' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {mouvement.nomMedicament || mouvement.medicament?.nomCommercial || 'Médicament inconnu'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">{TYPE_MOUVEMENT_LABELS[mouvement.type as TypeMouvement]}</span>
                        <span>•</span>
                        <span>{new Date(mouvement.createdAt).toLocaleString('fr-FR')}</span>
                        {mouvement.motif && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[200px]" title={mouvement.motif}>{mouvement.motif}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${mouvement.type === 'ENTREE' ? 'text-green-600' : 'text-red-600'}`}>
                      {mouvement.type === 'ENTREE' ? '+' : '-'}{mouvement.quantite}
                    </p>
                    <p className="text-xs text-slate-500">
                      Stock: {mouvement.quantiteAvant} → {mouvement.quantiteApres}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-slate-600">
                  Page {page} sur {data.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
