import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateConsultation, useUpdateConsultation } from '@/lib/hooks/useConsultations';
import { usePatients } from '@/lib/hooks/usePatients';
import { useMedicaments } from '@/lib/hooks/useMedicaments';
import {
  createConsultationSchema,
  calculerIMC,
  interpreterIMC,
  type ConsultationFormData,
  type Consultation,
} from '@/types/consultation';
import { formatMedicamentDisplay } from '@/types/medicament';
import { toast } from 'sonner';

interface ConsultationFormProps {
  consultation?: Consultation; // Si fourni, mode édition
  preselectedPatientId?: string; // Pour créer une consultation depuis la page patient
  onSuccess?: () => void;
}

export function ConsultationForm({ consultation, preselectedPatientId, onSuccess }: ConsultationFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!consultation;

  const createMutation = useCreateConsultation();
  const updateMutation = useUpdateConsultation();

  // État local pour recherche de patients et médicaments
  const [patientSearch, setPatientSearch] = useState('');
  const [medicamentSearch, setMedicamentSearch] = useState('');

  // Queries
  const { data: patientsData, isLoading: isPatientsLoading } = usePatients({
    search: patientSearch,
    limit: 100
  });

  const { data: medicamentsData, isLoading: isMedicamentsLoading } = useMedicaments({
    search: medicamentSearch,
    limit: 20,
  });

  // Convertir les données en options pour les combobox
  const patientOptions: ComboboxOption[] = patientsData?.data.map(patient => ({
    value: patient.id,
    label: `${patient.nom} ${patient.prenom} (${patient.matricule})`,
    description: `${patient.direction || patient.directionService || ''}`,
  })) || [];

  const medicamentOptions: ComboboxOption[] = medicamentsData?.data.map(medicament => ({
    value: medicament.id,
    label: formatMedicamentDisplay(medicament),
    description: `Code: ${medicament.code} - ${medicament.forme}`,
  })) || [];

  // Valeurs par défaut du formulaire
  const defaultValues: Partial<ConsultationFormData> = consultation
    ? {
      patientId: consultation.patientId,
      motif: consultation.motif,
      constantesVitales: consultation.constantesVitales,
      examenClinique: consultation.examenClinique ?? undefined,
      diagnostic: consultation.diagnostic ?? undefined,
      observations: consultation.observations ?? undefined,
      prochainRDV: consultation.prochainRDV?.split('T')[0],
      prescriptions: consultation.prescriptions.map(p => ({
        medicamentId: p.medicamentId,
        posologie: p.posologie,
        duree: p.duree,
      })),
    }
    : {
      patientId: preselectedPatientId || '',
      constantesVitales: {},
      prescriptions: [],
    };

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(createConsultationSchema),
    defaultValues,
  });

  // Field array for prescriptions
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'prescriptions',
  });

  // Réinitialiser le formulaire quand les données changent
  useEffect(() => {
    if (consultation) {
      form.reset({
        patientId: consultation.patientId,
        motif: consultation.motif,
        constantesVitales: consultation.constantesVitales,
        examenClinique: consultation.examenClinique ?? undefined,
        diagnostic: consultation.diagnostic ?? undefined,
        observations: consultation.observations ?? undefined,
        prochainRDV: consultation.prochainRDV?.split('T')[0],
        prescriptions: consultation.prescriptions.map(p => ({
          medicamentId: p.medicamentId,
          posologie: p.posologie,
          duree: p.duree,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultation?.id, consultation?.updatedAt]);

  const onSubmit = async (data: ConsultationFormData) => {
    try {
      if (isEditMode) {
        // Pour la mise à jour, exclure patientId et prescriptions (non modifiables)
        const { patientId, prescriptions, ...updateData } = data;
        await updateMutation.mutateAsync({
          id: consultation.id,
          data: updateData,
        });
        toast.success('Consultation modifiée avec succès');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Consultation créée avec succès');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/consultations');
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de la consultation`
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Calculer l'IMC en temps réel
  const poids = form.watch('constantesVitales.poids');
  const taille = form.watch('constantesVitales.taille');
  const imc = calculerIMC(poids, taille);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Sélection du Patient */}
        <Card>
          <CardHeader>
            <CardTitle>Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={patientOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      onSearchChange={setPatientSearch}
                      placeholder="Sélectionner un patient"
                      searchPlaceholder="Rechercher un patient..."
                      emptyMessage="Aucun patient trouvé"
                      isLoading={isPatientsLoading}
                      disabled={isEditMode || !!preselectedPatientId}
                      className={isEditMode || preselectedPatientId ? 'bg-slate-100' : ''}
                    />
                  </FormControl>
                  {(isEditMode || preselectedPatientId) && (
                    <FormDescription className="text-xs text-slate-500">
                      Le patient ne peut pas être modifié
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motif"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Motif de consultation *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrire le motif de la consultation..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Constantes Vitales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Constantes Vitales</span>
              {imc && (
                <div className="flex items-center gap-2 text-sm font-normal">
                  <Calculator className="h-4 w-4" />
                  <span>IMC: {imc} - {interpreterIMC(imc)}</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Température */}
              <FormField
                control={form.control}
                name="constantesVitales.temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Température (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="37.0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">35-42°C</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tension Systolique */}
              <FormField
                control={form.control}
                name="constantesVitales.tensionSystolique"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tension Systolique (mmHg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="120"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">50-250 mmHg</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tension Diastolique */}
              <FormField
                control={form.control}
                name="constantesVitales.tensionDiastolique"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tension Diastolique (mmHg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="80"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">30-150 mmHg</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fréquence Cardiaque */}
              <FormField
                control={form.control}
                name="constantesVitales.frequenceCardiaque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence Cardiaque (bpm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="70"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">30-200 bpm</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fréquence Respiratoire */}
              <FormField
                control={form.control}
                name="constantesVitales.frequenceRespiratoire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence Respiratoire (/min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="16"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">8-40 cycles/min</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Saturation Oxygène */}
              <FormField
                control={form.control}
                name="constantesVitales.saturationOxygene"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saturation O₂ (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="98"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">70-100%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Glycémie */}
              <FormField
                control={form.control}
                name="constantesVitales.glycemie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glycémie (g/L)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.95"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">0.3-5.0 g/L</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Poids */}
              <FormField
                control={form.control}
                name="constantesVitales.poids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="70.0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">1-300 kg</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Taille */}
              <FormField
                control={form.control}
                name="constantesVitales.taille"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="170"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">50-250 cm</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Examen, Diagnostic, Observations */}
        <Card>
          <CardHeader>
            <CardTitle>Examen et Diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="examenClinique"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Examen Clinique</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrire l'examen clinique effectué..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnostic</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Diagnostic médical..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observations complémentaires..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prochainRDV"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prochain Rendez-vous</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Prescriptions */}
        {!isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prescriptions</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ medicamentId: '', posologie: '', duree: '' })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une prescription
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Aucune prescription. Cliquez sur "Ajouter une prescription" pour commencer.
                </p>
              ) : (
                fields.map((field, index) => (
                  <Card key={field.id} className="border-slate-200">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`prescriptions.${index}.medicamentId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Médicament *</FormLabel>
                              <FormControl>
                                <Combobox
                                  options={medicamentOptions}
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  onSearchChange={setMedicamentSearch}
                                  placeholder="Sélectionner un médicament"
                                  searchPlaceholder="Rechercher un médicament..."
                                  emptyMessage="Aucun médicament trouvé"
                                  isLoading={isMedicamentsLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`prescriptions.${index}.posologie`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Posologie *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 1 comprimé 3x/jour" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`prescriptions.${index}.duree`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Durée *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 7 jours" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Retirer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Note pour mode édition */}
        {isEditMode && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Les prescriptions ne peuvent pas être modifiées après la création de la consultation.
                Pour consulter les prescriptions de cette consultation, veuillez voir la page de détails.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/consultations')}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-success hover:bg-success/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Modifier' : 'Créer'} la consultation
          </Button>
        </div>
      </form>
    </Form>
  );
}
