import { useState } from 'react';
import { Syringe, Plus, Calendar, User, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/hooks/useAuth';
import { useVaccinations, useCreateVaccination, useDeleteVaccination } from '@/lib/hooks/useVaccinations';
import { usePatients } from '@/lib/hooks/usePatients';
import { TYPES_VACCINS, formaterDateVaccination } from '@/types/vaccination';
import { toast } from 'sonner';

export function VaccinationsPage() {
  const { isInfirmier, user } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useVaccinations({
    search: search || undefined,
    typeVaccin: typeFilter || undefined,
    patientId: isInfirmier ? undefined : user?.id,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
            <Syringe className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            {isInfirmier ? 'Vaccinations' : 'Mes Vaccinations'}
          </h1>
          <p className="text-slate-600 mt-1">
            {isInfirmier
              ? 'Suivi des vaccinations du personnel'
              : 'Votre carnet de vaccination'}
          </p>
        </div>

        {isInfirmier && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Vaccination
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Enregistrer une vaccination</DialogTitle>
              </DialogHeader>
              <VaccinationForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtres */}
      {isInfirmier && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Rechercher un patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={typeFilter || undefined} onValueChange={setTypeFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {TYPES_VACCINS.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {typeFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTypeFilter('')}
                    className="px-3"
                  >
                    ✕
                  </Button>
                )}
              </div>

              <Button variant="outline" onClick={() => { setSearch(''); setTypeFilter(''); }}>
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table vaccinations */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Aucune vaccination enregistrée
            </div>
          ) : (
            <>
              {/* Pagination Controls - Top */}
              <div className="flex flex-row items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-slate-100 overflow-x-auto whitespace-nowrap text-xs md:text-sm">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-700 font-semibold">
                      {data.pagination?.total || data.data.length} vaccination{(data.pagination?.total || data.data.length) > 1 ? 's' : ''} au total
                    </p>
                    {data.pagination && data.pagination.totalPages > 1 && (
                      <>
                        <span className="text-slate-400">•</span>
                        <p className="text-slate-600">
                          Page {page} sur {data.pagination.totalPages}
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
                    <TableHead>Date</TableHead>
                    {isInfirmier && <TableHead>Patient</TableHead>}
                    <TableHead>Type de vaccin</TableHead>
                    <TableHead>N° Lot</TableHead>
                    <TableHead>Prochain rappel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((vaccination) => (
                    <TableRow key={vaccination.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {formaterDateVaccination(vaccination.date || vaccination.dateAdministration || '')}
                          </span>
                        </div>
                      </TableCell>
                      {isInfirmier && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">
                                {vaccination.patient?.nom} {vaccination.patient?.prenom}
                              </p>
                              <p className="text-xs text-slate-500">
                                {vaccination.patient?.matricule}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          {vaccination.typeVaccin}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {vaccination.numeroLot || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {vaccination.prochainRappel ? (
                          <span className="text-sm text-slate-600">
                            {formaterDateVaccination(vaccination.prochainRappel)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VaccinationForm({ onClose }: { onClose: () => void }) {
  const [patientId, setPatientId] = useState('');
  const [typeVaccin, setTypeVaccin] = useState('');
  const [numeroLot, setNumeroLot] = useState('');
  const [prochainRappel, setProchainRappel] = useState('');
  const [notes, setNotes] = useState('');

  const { data: patients } = usePatients({ limit: 100 });
  const createMutation = useCreateVaccination();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || !typeVaccin) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createMutation.mutateAsync({
        patientId,
        typeVaccin,
        // La date n'est pas envoyée - générée automatiquement par le serveur
        numeroLot: numeroLot || undefined,
        prochainRappel: prochainRappel || undefined,
        notes: notes || undefined,
      });

      toast.success('Vaccination enregistrée avec succès');
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Patient *</Label>
        <Select value={patientId} onValueChange={setPatientId}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Sélectionner un patient" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {patients?.data.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.nom} {patient.prenom} ({patient.matricule})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Type de vaccin *</Label>
        <Select value={typeVaccin} onValueChange={setTypeVaccin}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {TYPES_VACCINS.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Numéro de lot</Label>
        <Input
          value={numeroLot}
          onChange={(e) => setNumeroLot(e.target.value)}
          placeholder="Ex: VAC2025-001"
          className="bg-white"
        />
        <p className="text-xs text-slate-500 mt-1">
          La date d'administration sera enregistrée automatiquement à la création
        </p>
      </div>

      <div>
        <Label>Date du prochain rappel</Label>
        <Input
          type="date"
          value={prochainRappel}
          onChange={(e) => setProchainRappel(e.target.value)}
          className="bg-white"
        />
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes additionnelles..."
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
