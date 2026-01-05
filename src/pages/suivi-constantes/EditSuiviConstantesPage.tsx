import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2, Activity } from 'lucide-react';
import {
    useSuiviConstante,
    useUpdateSuiviConstantes,
} from '@/lib/hooks/useSuiviConstantes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    suiviConstantesUpdateSchema,
    type UpdateSuiviConstantesDTO,
} from '@/types/suivi-constantes';

export function EditSuiviConstantesPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: constante, isLoading } = useSuiviConstante(id);
    const updateMutation = useUpdateSuiviConstantes();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdateSuiviConstantesDTO>({
        resolver: zodResolver(suiviConstantesUpdateSchema),
        values: constante
            ? {
                datePrise: constante.datePrise?.slice(0, 16), // Format datetime-local
                tensionSystolique: constante.tensionSystolique,
                tensionDiastolique: constante.tensionDiastolique,
                frequenceCardiaque: constante.frequenceCardiaque,
                frequenceRespiratoire: constante.frequenceRespiratoire,
                temperature: constante.temperature,
                saturationOxygene: constante.saturationOxygene,
                glycemie: constante.glycemie,
                poids: constante.poids,
                taille: constante.taille,
                observations: constante.observations,
            }
            : undefined,
    });

    const onSubmit = async (data: UpdateSuiviConstantesDTO) => {
        if (!id) return;

        try {
            await updateMutation.mutateAsync({ id, data });
            toast.success('Constantes modifiées avec succès');
            navigate(`/suivi-constantes/${id}`);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors de la modification';
            toast.error(message);
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

    if (!constante) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
                <p className="font-semibold">Prise de constantes introuvable</p>
                <Button onClick={() => navigate('/suivi-constantes')} className="mt-4">
                    Retour à la liste
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            {/* Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/suivi-constantes/${id}`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-lg md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
                        <Activity className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                        Modifier la prise de constantes
                    </h1>
                </div>
                <p className="text-slate-600">
                    Patient: {constante.patient?.prenom} {constante.patient?.nom}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Informations générales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Date de prise */}
                        <div className="space-y-2">
                            <Label htmlFor="datePrise">Date et heure de prise</Label>
                            <Input
                                id="datePrise"
                                type="datetime-local"
                                {...register('datePrise')}
                                className={errors.datePrise ? 'border-red-500' : ''}
                            />
                            {errors.datePrise && (
                                <p className="text-sm text-red-600">{errors.datePrise.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Constantes vitales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Constantes vitales</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tension artérielle */}
                        <div className="space-y-2">
                            <Label htmlFor="tensionSystolique">Tension systolique (mmHg)</Label>
                            <Input
                                id="tensionSystolique"
                                type="number"
                                step="1"
                                {...register('tensionSystolique', { valueAsNumber: true })}
                                className={errors.tensionSystolique ? 'border-red-500' : ''}
                            />
                            {errors.tensionSystolique && (
                                <p className="text-sm text-red-600">{errors.tensionSystolique.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tensionDiastolique">Tension diastolique (mmHg)</Label>
                            <Input
                                id="tensionDiastolique"
                                type="number"
                                step="1"
                                {...register('tensionDiastolique', { valueAsNumber: true })}
                                className={errors.tensionDiastolique ? 'border-red-500' : ''}
                            />
                            {errors.tensionDiastolique && (
                                <p className="text-sm text-red-600">{errors.tensionDiastolique.message}</p>
                            )}
                        </div>

                        {/* Fréquence cardiaque */}
                        <div className="space-y-2">
                            <Label htmlFor="frequenceCardiaque">Fréquence cardiaque (bpm)</Label>
                            <Input
                                id="frequenceCardiaque"
                                type="number"
                                step="1"
                                {...register('frequenceCardiaque', { valueAsNumber: true })}
                                className={errors.frequenceCardiaque ? 'border-red-500' : ''}
                            />
                            {errors.frequenceCardiaque && (
                                <p className="text-sm text-red-600">{errors.frequenceCardiaque.message}</p>
                            )}
                        </div>

                        {/* Fréquence respiratoire */}
                        <div className="space-y-2">
                            <Label htmlFor="frequenceRespiratoire">Fréquence respiratoire (/min)</Label>
                            <Input
                                id="frequenceRespiratoire"
                                type="number"
                                step="1"
                                {...register('frequenceRespiratoire', { valueAsNumber: true })}
                                className={errors.frequenceRespiratoire ? 'border-red-500' : ''}
                            />
                            {errors.frequenceRespiratoire && (
                                <p className="text-sm text-red-600">{errors.frequenceRespiratoire.message}</p>
                            )}
                        </div>

                        {/* Température */}
                        <div className="space-y-2">
                            <Label htmlFor="temperature">Température (°C)</Label>
                            <Input
                                id="temperature"
                                type="number"
                                step="0.1"
                                {...register('temperature', { valueAsNumber: true })}
                                className={errors.temperature ? 'border-red-500' : ''}
                            />
                            {errors.temperature && (
                                <p className="text-sm text-red-600">{errors.temperature.message}</p>
                            )}
                        </div>

                        {/* Saturation en oxygène */}
                        <div className="space-y-2">
                            <Label htmlFor="saturationOxygene">Saturation en oxygène (%)</Label>
                            <Input
                                id="saturationOxygene"
                                type="number"
                                step="1"
                                {...register('saturationOxygene', { valueAsNumber: true })}
                                className={errors.saturationOxygene ? 'border-red-500' : ''}
                            />
                            {errors.saturationOxygene && (
                                <p className="text-sm text-red-600">{errors.saturationOxygene.message}</p>
                            )}
                        </div>

                        {/* Glycémie */}
                        <div className="space-y-2">
                            <Label htmlFor="glycemie">Glycémie (g/L)</Label>
                            <Input
                                id="glycemie"
                                type="number"
                                step="0.01"
                                {...register('glycemie', { valueAsNumber: true })}
                                className={errors.glycemie ? 'border-red-500' : ''}
                            />
                            {errors.glycemie && (
                                <p className="text-sm text-red-600">{errors.glycemie.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Mesures anthropométriques */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mesures anthropométriques</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Poids */}
                        <div className="space-y-2">
                            <Label htmlFor="poids">Poids (kg)</Label>
                            <Input
                                id="poids"
                                type="number"
                                step="0.1"
                                {...register('poids', { valueAsNumber: true })}
                                className={errors.poids ? 'border-red-500' : ''}
                            />
                            {errors.poids && <p className="text-sm text-red-600">{errors.poids.message}</p>}
                        </div>

                        {/* Taille */}
                        <div className="space-y-2">
                            <Label htmlFor="taille">Taille (cm)</Label>
                            <Input
                                id="taille"
                                type="number"
                                step="0.1"
                                {...register('taille', { valueAsNumber: true })}
                                className={errors.taille ? 'border-red-500' : ''}
                            />
                            {errors.taille && <p className="text-sm text-red-600">{errors.taille.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Observations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Observations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="observations">Observations (optionnel)</Label>
                            <Textarea
                                id="observations"
                                rows={4}
                                {...register('observations')}
                                className={errors.observations ? 'border-red-500' : ''}
                            />
                            {errors.observations && (
                                <p className="text-sm text-red-600">{errors.observations.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/suivi-constantes/${id}`)}
                        disabled={updateMutation.isPending}
                    >
                        Annuler
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                        {updateMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Enregistrer
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
