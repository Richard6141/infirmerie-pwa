import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Plus, Search, Eye, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSuiviConstantes, useDeleteSuiviConstantes, useEvolutionConstantes } from '@/lib/hooks/useSuiviConstantes';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMyPatientProfile } from '@/lib/hooks/usePatients';
import { Role } from '@/lib/types/models';
import { SuiviConstantesCharts } from './components/SuiviConstantesCharts';
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
    formatDatePrise,
    getCouleurIMC,
    getCouleurGlycemie,
    getCouleurTension
} from '@/types/suivi-constantes';
import type { SuiviConstantes } from '@/types/suivi-constantes';
import { toast } from 'sonner';

export function SuiviConstantesPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [constanteToDelete, setConstanteToDelete] = useState<SuiviConstantes | null>(null);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // React Query hooks
    const { data, isLoading, isError, error } = useSuiviConstantes({
        search: debouncedSearch,
        page,
        limit: pageSize,
    });

    const deleteMutation = useDeleteSuiviConstantes();

    // Auth & Check Role
    const { user } = useAuth();
    const isPatient = user?.role === Role.PATIENT;

    // Pour Patient : Récupérer son profil patient directement via /patients/me
    const {
        data: myPatient,
        isLoading: isLoadingPatient,
        isError: isPatientError
    } = useMyPatientProfile();

    const { data: evolution, isLoading: isLoadingEvolution } = useEvolutionConstantes(myPatient?.id);

    // Si c'est un patient, on retourne une vue simplifiée AVEC GRAPHIQUES UNIQUEMENT
    if (isPatient) {
        if (isLoadingPatient || (myPatient && isLoadingEvolution)) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (isPatientError || !myPatient) {
            return (
                <div className="space-y-6">
                    <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
                        <Activity className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        Mes Constantes
                    </h1>
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                        <Activity className="h-12 w-12 mb-3 text-slate-300" />
                        <p className="font-semibold">Dossier patient non trouvé</p>
                        <p className="text-sm mt-1">Votre compte utilisateur n'est pas encore lié à un dossier patient.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
                        <Activity className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        Mes Constantes
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Suivez l'évolution de vos constantes vitales
                    </p>
                </div>

                {evolution ? (
                    <SuiviConstantesCharts evolution={evolution} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                        <Activity className="h-12 w-12 mb-3 text-slate-300" />
                        <p className="font-semibold">Aucune donnée disponible</p>
                        <p className="text-sm mt-1">Aucune prise de constantes n'a été enregistrée pour le moment.</p>
                    </div>
                )}
            </div>
        );
    }

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    // Delete handlers
    const handleDeleteClick = (constante: SuiviConstantes) => {
        setConstanteToDelete(constante);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!constanteToDelete) return;

        try {
            await deleteMutation.mutateAsync(constanteToDelete.id);
            toast.success('Prise de constantes supprimée avec succès');
            setDeleteDialogOpen(false);
            setConstanteToDelete(null);
        } catch (err) {
            toast.error('Erreur lors de la suppression');
            console.error(err);
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
                        <Activity className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        Suivi des Constantes Médicales
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Enregistrer et suivre l'évolution des constantes vitales des patients
                    </p>
                </div>

                <Link to="/suivi-constantes/nouveau">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nouvelle Prise
                    </Button>
                </Link>
            </div>

            {/* Filters & Search */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recherche et Filtres</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher par nom de patient, matricule..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-12 text-destructive">
                            <p className="font-semibold">Erreur lors du chargement</p>
                            <p className="text-sm mt-1">{error.message}</p>
                        </div>
                    ) : !data || data.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Activity className="h-12 w-12 mb-3 text-slate-300" />
                            <p className="font-semibold">Aucune prise de constantes trouvée</p>
                            <p className="text-sm mt-1">Commencez par enregistrer une nouvelle prise</p>
                        </div>
                    ) : (
                        <>
                            {/* Pagination Controls - Top */}
                            <div className="flex flex-row items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-slate-100 overflow-x-auto whitespace-nowrap text-xs md:text-sm">
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-slate-700 font-semibold">
                                            {data.total} prise{data.total > 1 ? 's' : ''} au total
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

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="whitespace-nowrap text-xs md:text-sm">
                                            <TableHead>Date</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Tension</TableHead>
                                            <TableHead>Glycémie</TableHead>
                                            <TableHead>IMC</TableHead>
                                            <TableHead>Température</TableHead>
                                            <TableHead>SpO₂</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.data.map((constante) => (
                                            <TableRow key={constante.id}>
                                                <TableCell className="font-medium">
                                                    {formatDatePrise(constante.datePrise)}
                                                </TableCell>
                                                <TableCell>
                                                    {constante.patient ? (
                                                        <div>
                                                            <p className="font-medium">
                                                                {constante.patient.prenom} {constante.patient.nom}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {constante.patient.matricule}
                                                            </p>
                                                        </div>
                                                    ) : constante.nomPatient ? (
                                                        <div>
                                                            <p className="font-medium">
                                                                {constante.nomPatient}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {constante.matriculePatient || '-'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {constante.tensionSystolique && constante.tensionDiastolique ? (
                                                        <div>
                                                            <p className="font-medium">
                                                                {constante.tensionSystolique}/{constante.tensionDiastolique} mmHg
                                                            </p>
                                                            {constante.classificationTension && (
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getCouleurTension(constante.classificationTension)}`}
                                                                >
                                                                    {constante.classificationTension}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {constante.glycemie ? (
                                                        <div>
                                                            <p className="font-medium">{constante.glycemie} g/L</p>
                                                            {constante.classificationGlycemie && (
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getCouleurGlycemie(constante.classificationGlycemie)}`}
                                                                >
                                                                    {constante.classificationGlycemie}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {constante.imc ? (
                                                        <div>
                                                            <p className="font-medium">{constante.imc}</p>
                                                            {constante.classificationIMC && (
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getCouleurIMC(constante.classificationIMC)}`}
                                                                >
                                                                    {constante.classificationIMC}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {constante.temperature ? `${constante.temperature}°C` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {constante.saturationOxygene ? `${constante.saturationOxygene}%` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link to={`/suivi-constantes/${constante.id}`}>
                                                            <Button variant="ghost" size="icon" title="Voir détails">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link to={`/suivi-constantes/${constante.id}/modifier`}>
                                                            <Button variant="ghost" size="icon" title="Modifier">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Supprimer"
                                                            onClick={() => handleDeleteClick(constante)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 text-xl">
                            Confirmer la suppression
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 text-base mt-2">
                            Êtes-vous sûr de vouloir supprimer cette prise de constantes du{' '}
                            <span className="font-semibold text-slate-900">
                                {constanteToDelete && formatDatePrise(constanteToDelete.datePrise)}
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
