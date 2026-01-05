import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, Calendar, Calculator } from 'lucide-react';
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
import { useCreateReposSanitaire, useUpdateReposSanitaire } from '@/lib/hooks/useReposSanitaire';
import { usePatients } from '@/lib/hooks/usePatients';
import {
  createReposSanitaireSchema,
  calculerDateFin,
  suggererDateControle,
  formaterDuree,
  type ReposSanitaireFormData,
  type ReposSanitaire,
} from '@/types/repos-sanitaire';
import { toast } from 'sonner';

interface ReposSanitaireFormProps {
  reposSanitaire?: ReposSanitaire; // Si fourni, mode édition
  preselectedPatientId?: string; // Pour créer depuis la page patient
  onSuccess?: () => void;
}

export function ReposSanitaireForm({
  reposSanitaire,
  preselectedPatientId,
  onSuccess
}: ReposSanitaireFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!reposSanitaire;

  const createMutation = useCreateReposSanitaire();
  const updateMutation = useUpdateReposSanitaire();

  // État local pour recherche de patients
  const [patientSearch, setPatientSearch] = useState('');

  // Query patients
  const { data: patientsData, isLoading: isPatientsLoading } = usePatients({
    search: patientSearch,
    limit: 20
  });

  // Convertir les patients en options pour le combobox
  const patientOptions: ComboboxOption[] = patientsData?.data.map(patient => ({
    value: patient.id,
    label: `${patient.nom} ${patient.prenom}`,
    description: `Matricule: ${patient.matricule} - ${patient.sexe}`,
  })) || [];

  // Valeurs par défaut du formulaire
  const defaultValues: Partial<ReposSanitaireFormData> = reposSanitaire
    ? {
        patientId: reposSanitaire.patientId,
        dateExamen: reposSanitaire.dateExamen.split('T')[0],
        diagnosticFinal: reposSanitaire.diagnosticFinal,
        soinsInstitues: reposSanitaire.soinsInstitues,
        dureeRepos: reposSanitaire.dureeRepos,
        dateDebut: reposSanitaire.dateDebut.split('T')[0],
        dateFin: reposSanitaire.dateFin.split('T')[0],
        dateControle: reposSanitaire.dateControle?.split('T')[0],
        lieuRedaction: reposSanitaire.lieuRedaction,
      }
    : {
        patientId: preselectedPatientId || '',
        dateExamen: new Date().toISOString().split('T')[0],
        lieuRedaction: 'Kinshasa',
      };

  const form = useForm<ReposSanitaireFormData>({
    resolver: zodResolver(createReposSanitaireSchema),
    defaultValues,
  });

  // Réinitialiser le formulaire quand les données changent (mode édition)
  useEffect(() => {
    if (reposSanitaire) {
      form.reset({
        patientId: reposSanitaire.patientId,
        dateExamen: reposSanitaire.dateExamen.split('T')[0],
        diagnosticFinal: reposSanitaire.diagnosticFinal,
        soinsInstitues: reposSanitaire.soinsInstitues,
        dureeRepos: reposSanitaire.dureeRepos,
        dateDebut: reposSanitaire.dateDebut.split('T')[0],
        dateFin: reposSanitaire.dateFin.split('T')[0],
        dateControle: reposSanitaire.dateControle?.split('T')[0],
        lieuRedaction: reposSanitaire.lieuRedaction,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reposSanitaire?.id, reposSanitaire?.updatedAt]);

  // Calcul automatique de la date de fin
  const dateDebut = form.watch('dateDebut');
  const dureeRepos = form.watch('dureeRepos');

  useEffect(() => {
    if (dateDebut && dureeRepos) {
      const dateFin = calculerDateFin(dateDebut, dureeRepos);
      form.setValue('dateFin', dateFin);

      // Suggérer une date de contrôle (7 jours après la fin)
      const dateControle = suggererDateControle(dateFin);
      if (!form.getValues('dateControle')) {
        form.setValue('dateControle', dateControle);
      }
    }
  }, [dateDebut, dureeRepos, form]);

  const onSubmit = async (data: ReposSanitaireFormData) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: reposSanitaire.id,
          data,
        });
        toast.success('Fiche de repos sanitaire modifiée avec succès');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Fiche de repos sanitaire créée avec succès');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/repos-sanitaire');
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de la fiche`
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Formatage de la durée pour affichage
  const dureeFormatee = dureeRepos ? formaterDuree(dureeRepos) : null;

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
              name="dateExamen"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Date d'examen *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Date de la consultation ayant conduit au repos sanitaire
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Diagnostic et Soins */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic et Soins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="diagnosticFinal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnostic final *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrire le diagnostic médical complet..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Minimum 5 caractères, maximum 1000 caractères
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="soinsInstitues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soins institués *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrire les soins et traitements prescrits..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Minimum 5 caractères, maximum 1000 caractères
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Durée du Repos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Repos Physique</span>
              {dureeFormatee && (
                <div className="flex items-center gap-2 text-sm font-normal text-slate-600">
                  <Calculator className="h-4 w-4" />
                  <span>Durée: {dureeFormatee}</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="dureeRepos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durée du repos (en jours) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      placeholder="7"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Entre 1 et 365 jours (jours calendaires incluant weekends)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateDebut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Premier jour du repos sanitaire
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Date de fin *
                      <Calendar className="h-3 w-3 text-slate-400" />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-slate-50"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-blue-600">
                      Calculée automatiquement (modifiable)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dateControle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de contrôle physique (optionnel)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Date suggérée pour le suivi post-repos (suggérée automatiquement: 7 jours après la fin)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Lieu de Rédaction */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Administratives</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="lieuRedaction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu de rédaction</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Kinshasa"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Ville ou lieu où le document est rédigé (défaut: Kinshasa)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/repos-sanitaire')}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-success hover:bg-success/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Modifier' : 'Créer'} la fiche de repos
          </Button>
        </div>
      </form>
    </Form>
  );
}
