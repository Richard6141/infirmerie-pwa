import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { useCreateRendezVous, useUpdateRendezVous } from '@/lib/hooks/useRendezVous';
import { usePatients } from '@/lib/hooks/usePatients';
import {
  createRendezVousSchema,
  STATUT_RDV_VALUES,
  STATUT_RDV_LABELS,
  type RendezVousFormData,
  type RendezVous,
} from '@/types/rendez-vous';
import { toast } from 'sonner';

interface RendezVousFormProps {
  rendezVous?: RendezVous;
  onSuccess?: () => void;
  initialDate?: string; // Date pré-remplie depuis le calendrier
}

export function RendezVousForm({ rendezVous, onSuccess, initialDate }: RendezVousFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!rendezVous;

  const createMutation = useCreateRendezVous();
  const updateMutation = useUpdateRendezVous();

  // État pour la recherche de patients
  const [patientSearch, setPatientSearch] = useState('');
  const { data: patientsData } = usePatients({ search: patientSearch, limit: 50 });

  // Formater la date initiale pour le champ datetime-local si fournie
  const formatInitialDate = (dateStr: string | undefined): string | undefined => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr);
      // Format: YYYY-MM-DDTHH:mm (requis par datetime-local)
      return date.toISOString().slice(0, 16);
    } catch {
      return undefined;
    }
  };

  const defaultValues: Partial<RendezVousFormData> = rendezVous
    ? {
        patientId: rendezVous.patientId,
        dateHeure: rendezVous.dateHeure,
        motif: rendezVous.motif,
        statut: rendezVous.statut,
        notes: rendezVous.notes ?? undefined,
      }
    : {
        statut: 'PLANIFIE',
        dateHeure: formatInitialDate(initialDate), // Pré-remplir avec la date du calendrier
      };

  const form = useForm<RendezVousFormData>({
    resolver: zodResolver(createRendezVousSchema),
    defaultValues,
  });

  useEffect(() => {
    if (rendezVous) {
      form.reset({
        patientId: rendezVous.patientId,
        dateHeure: rendezVous.dateHeure,
        motif: rendezVous.motif,
        statut: rendezVous.statut,
        notes: rendezVous.notes ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendezVous?.id, rendezVous?.updatedAt]);

  const onSubmit = async (data: RendezVousFormData) => {
    try {
      if (isEditMode) {
        // Pour la mise à jour, exclure patientId
        const { patientId, ...updateData } = data;
        await updateMutation.mutateAsync({
          id: rendezVous.id,
          data: updateData,
        });
        toast.success('Rendez-vous modifié avec succès');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Rendez-vous créé avec succès');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/rendez-vous');
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} du rendez-vous`
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Options pour le combobox patient
  const patientOptions = patientsData?.data.map((patient) => ({
    value: patient.id,
    label: `${patient.nom} ${patient.prenom} (${patient.matricule})`,
  })) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Sélection du patient */}
        {!isEditMode && (
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
                    placeholder="Sélectionner un patient..."
                    searchPlaceholder="Rechercher un patient..."
                    onSearchChange={setPatientSearch}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Date et heure */}
        <FormField
          control={form.control}
          name="dateHeure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date et Heure *</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  className="bg-white"
                  {...field}
                  value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
                />
              </FormControl>
              <FormDescription>
                {initialDate && !isEditMode ? (
                  <span className="text-cyan-600 font-medium">
                    ✓ Date pré-remplie depuis le calendrier
                  </span>
                ) : (
                  'Sélectionnez la date et l\'heure du rendez-vous'
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Motif */}
        <FormField
          control={form.control}
          name="motif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motif *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez le motif du rendez-vous..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Statut */}
        <FormField
          control={form.control}
          name="statut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white">
                  {STATUT_RDV_VALUES.map((statut) => (
                    <SelectItem key={statut} value={statut}>
                      {STATUT_RDV_LABELS[statut]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Par défaut: Planifié
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notes complémentaires..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/rendez-vous')}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Modifier' : 'Créer'} le rendez-vous
          </Button>
        </div>
      </form>
    </Form>
  );
}
