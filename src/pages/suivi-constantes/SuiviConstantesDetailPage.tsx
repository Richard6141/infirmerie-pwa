import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Activity, TrendingUp, Loader2 } from 'lucide-react';
import {
    useSuiviConstante,
    useDeleteSuiviConstantes,
    useEvolutionConstantes,
} from '@/lib/hooks/useSuiviConstantes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { SuiviConstantesCharts } from './components/SuiviConstantesCharts';
import {
    formatDatePrise,
    getCouleurIMC,
    getCouleurGlycemie,
    getCouleurTension,
} from '@/types/suivi-constantes';
import { toast } from 'sonner';
import { useState } from 'react';

export function SuiviConstantesDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data: constante, isLoading, isError } = useSuiviConstante(id);
    const deleteMutation = useDeleteSuiviConstantes();

    // Charger l'évolution si on a un patient
    const { data: evolution } = useEvolutionConstantes(constante?.patientId);

    const handleDelete = async () => {
        if (!id) return;

        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Prise de constantes supprimée avec succès');
            navigate('/suivi-constantes');
        } catch (error) {
            toast.error('Erreur lors de la suppression');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !constante) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
                <p className="font-semibold">Erreur lors du chargement</p>
                <Button onClick={() => navigate('/suivi-constantes')} className="mt-4">
                    Retour à la liste
                </Button>
            </div>
        );
    }

    // Données préparées par SuiviConstantesCharts désormais

    return (
        <div className="space-y-6">
            {/* Header */}
            {/* Header */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate('/suivi-constantes')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-lg md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
                            <Activity className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                            Détail de la prise
                        </h1>
                    </div>

                    <div className="flex gap-2">
                        <Link to={`/suivi-constantes/${id}/modifier`}>
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
                </div>
                <p className="text-slate-600 ml-14 md:ml-0">
                    {formatDatePrise(constante.datePrise)}
                </p>
            </div>

            {/* Informations patient */}
            {
                constante.patient && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-slate-600">Nom complet</p>
                                    <p className="font-semibold">
                                        {constante.patient.prenom} {constante.patient.nom}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Matricule</p>
                                    <p className="font-semibold">{constante.patient.matricule}</p>
                                </div>
                                <div>
                                    <Link to={`/patients/${constante.patient.id}`}>
                                        <Button variant="outline" size="sm">
                                            Voir le dossier patient
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Constantes vitales */}
            <Card>
                <CardHeader>
                    <CardTitle>Constantes vitales</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Tension artérielle */}
                        {constante.tensionSystolique && constante.tensionDiastolique && (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-600">Tension artérielle</p>
                                <p className="text-2xl font-bold">
                                    {constante.tensionSystolique}/{constante.tensionDiastolique} mmHg
                                </p>
                                {constante.classificationTension && (
                                    <span
                                        className={`inline-block px-3 py-1 rounded-md text-sm font-medium border ${getCouleurTension(constante.classificationTension)}`}
                                    >
                                        {constante.classificationTension}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Fréquence cardiaque */}
                        {constante.frequenceCardiaque && (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-600">Fréquence cardiaque</p>
                                <p className="text-2xl font-bold">{constante.frequenceCardiaque} bpm</p>
                            </div>
                        )}

                        {/* Fréquence respiratoire */}
                        {constante.frequenceRespiratoire && (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-600">Fréquence respiratoire</p>
                                <p className="text-2xl font-bold">{constante.frequenceRespiratoire} /min</p>
                            </div>
                        )}

                        {/* Température */}
                        {constante.temperature && (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-600">Température</p>
                                <p className="text-2xl font-bold">{constante.temperature}°C</p>
                            </div>
                        )}

                        {/* Saturation en oxygène */}
                        {constante.saturationOxygene && (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-600">Saturation en oxygène</p>
                                <p className="text-2xl font-bold">{constante.saturationOxygene}%</p>
                            </div>
                        )}

                        {/* Glycémie */}
                        {constante.glycemie && (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-600">Glycémie</p>
                                <p className="text-2xl font-bold">{constante.glycemie} g/L</p>
                                {constante.classificationGlycemie && (
                                    <span
                                        className={`inline-block px-3 py-1 rounded-md text-sm font-medium border ${getCouleurGlycemie(constante.classificationGlycemie)}`}
                                    >
                                        {constante.classificationGlycemie}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Mesures anthropométriques */}
            {
                (constante.poids || constante.taille || constante.imc) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Mesures anthropométriques</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {constante.poids && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-600">Poids</p>
                                        <p className="text-2xl font-bold">{constante.poids} kg</p>
                                    </div>
                                )}

                                {constante.taille && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-600">Taille</p>
                                        <p className="text-2xl font-bold">{constante.taille} cm</p>
                                    </div>
                                )}

                                {constante.imc && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-600">IMC</p>
                                        <p className="text-2xl font-bold">{constante.imc}</p>
                                        {constante.classificationIMC && (
                                            <span
                                                className={`inline-block px-3 py-1 rounded-md text-sm font-medium border ${getCouleurIMC(constante.classificationIMC)}`}
                                            >
                                                {constante.classificationIMC}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Observations */}
            {
                constante.observations && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Observations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 whitespace-pre-wrap">{constante.observations}</p>
                        </CardContent>
                    </Card>
                )
            }

            {/* Graphiques d'évolution */}
            {
                evolution && (
                    <SuiviConstantesCharts evolution={evolution} />
                )
            }

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 text-xl">Confirmer la suppression</DialogTitle>
                        <DialogDescription className="text-slate-600 text-base mt-2">
                            Êtes-vous sûr de vouloir supprimer cette prise de constantes ? Cette action est
                            irréversible.
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
