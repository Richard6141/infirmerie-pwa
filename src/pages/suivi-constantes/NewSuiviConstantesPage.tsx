import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Activity } from 'lucide-react';
import { useCreateSuiviConstantes } from '@/lib/hooks/useSuiviConstantes';
import { usePatients } from '@/lib/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    suiviConstantesCreateSchema,
    type SuiviConstantesFormData,
} from '@/types/suivi-constantes';
import { getPatientFullName } from '@/types/patient';

export function NewSuiviConstantesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedPatientId = searchParams.get('patientId');
    const createMutation = useCreateSuiviConstantes();

    // Charger la liste des patients pour le select
    const { data: patientsData } = usePatients({ limit: 1000 });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<SuiviConstantesFormData>({
        resolver: zodResolver(suiviConstantesCreateSchema),
        defaultValues: {
            datePrise: new Date().toISOString().slice(0, 16), // Format datetime-local
            patientId: preselectedPatientId || undefined,
        },
    });

    const patientId = watch('patientId');

    const onSubmit = async (data: SuiviConstantesFormData) => {
        try {
            await createMutation.mutateAsync(data);
            toast.success('Constantes enregistrées avec succès');
            navigate('/suivi-constantes');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors de l\'enregistrement';
            toast.error(message);
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/suivi-constantes')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
                        <Activity className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        Nouvelle Prise de Constantes
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Enregistrer les constantes vitales d'un patient
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Informations générales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Patient */}
                        <div className="space-y-2">
                            <Label htmlFor="patientId">
                                Patient <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={patientId}
                                onValueChange={(value) => setValue('patientId', value, { shouldValidate: true })}
                            >
                                <SelectTrigger
                                    id="patientId"
                                    className={errors.patientId ? 'border-red-500' : ''}
                                >
                                    <SelectValue placeholder="Sélectionner un patient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {patientsData?.data.map((patient) => (
                                        <SelectItem key={patient.id} value={patient.id}>
                                            {getPatientFullName(patient)} - {patient.matricule}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.patientId && (
                                <p className="text-sm text-red-600">{errors.patientId.message}</p>
                            )}
                        </div>

                        {/* Date de prise */}
                        <div className="space-y-2">
                            <Label htmlFor="datePrise">
                                Date et heure de prise <span className="text-red-500">*</span>
                            </Label>
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
                                placeholder="120"
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
                                placeholder="80"
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
                                placeholder="70"
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
                                placeholder="16"
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
                                placeholder="37.0"
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
                                placeholder="98"
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
                                placeholder="1.0"
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
                                placeholder="70.0"
                                {...register('poids', { valueAsNumber: true })}
                                className={errors.poids ? 'border-red-500' : ''}
                            />
                            {errors.poids && (
                                <p className="text-sm text-red-600">{errors.poids.message}</p>
                            )}
                        </div>

                        {/* Taille */}
                        <div className="space-y-2">
                            <Label htmlFor="taille">Taille (cm)</Label>
                            <Input
                                id="taille"
                                type="number"
                                step="0.1"
                                placeholder="170.0"
                                {...register('taille', { valueAsNumber: true })}
                                className={errors.taille ? 'border-red-500' : ''}
                            />
                            {errors.taille && (
                                <p className="text-sm text-red-600">{errors.taille.message}</p>
                            )}
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
                                placeholder="Notes complémentaires..."
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
                        onClick={() => navigate('/suivi-constantes')}
                        disabled={createMutation.isPending}
                    >
                        Annuler
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                        {createMutation.isPending ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
