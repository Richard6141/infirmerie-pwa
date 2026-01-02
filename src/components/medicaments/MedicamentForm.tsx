import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateMedicament, useUpdateMedicament } from '@/lib/hooks/useMedicaments';
import {
  createMedicamentSchema,
  FORME_GALENIQUE_VALUES,
  FORME_GALENIQUE_LABELS,
  type MedicamentFormData,
  type Medicament,
} from '@/types/medicament';
import { toast } from 'sonner';

interface MedicamentFormProps {
  medicament?: Medicament;
  onSuccess?: () => void;
}

export function MedicamentForm({ medicament, onSuccess }: MedicamentFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!medicament;

  const createMutation = useCreateMedicament();
  const updateMutation = useUpdateMedicament();

  const defaultValues: Partial<MedicamentFormData> = medicament
    ? {
        code: medicament.code,
        dci: medicament.dci,
        nomCommercial: medicament.nomCommercial,
        forme: medicament.forme,
        dosage: medicament.dosage,
        seuilMin: medicament.stock?.seuilMin,
        seuilMax: medicament.stock?.seuilMax,
        stockSecurite: medicament.stock?.stockSecurite,
      }
    : {};

  const form = useForm<MedicamentFormData>({
    resolver: zodResolver(createMedicamentSchema),
    defaultValues,
  });

  useEffect(() => {
    if (medicament) {
      form.reset({
        code: medicament.code,
        dci: medicament.dci,
        nomCommercial: medicament.nomCommercial,
        forme: medicament.forme,
        dosage: medicament.dosage,
        seuilMin: medicament.stock?.seuilMin,
        seuilMax: medicament.stock?.seuilMax,
        stockSecurite: medicament.stock?.stockSecurite,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicament?.id, medicament?.updatedAt]);

  const onSubmit = async (data: MedicamentFormData) => {
    try {
      if (isEditMode) {
        // Pour la mise à jour, on ne peut pas modifier le code
        const { code, ...updateData } = data;
        await updateMutation.mutateAsync({
          id: medicament.id,
          data: updateData,
        });
        toast.success('Médicament modifié avec succès');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Médicament créé avec succès');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/medicaments');
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} du médicament`
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du Médicament</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="MED-2024-001"
                        {...field}
                        disabled={isEditMode}
                        className={isEditMode ? 'bg-slate-100' : ''}
                      />
                    </FormControl>
                    {isEditMode && (
                      <FormDescription className="text-xs text-slate-500">
                        Le code ne peut pas être modifié
                      </FormDescription>
                    )}
                    <FormDescription className="text-xs">
                      Format: Majuscules, chiffres et tirets uniquement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Forme galénique */}
              <FormField
                control={form.control}
                name="forme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forme galénique *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionner une forme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {FORME_GALENIQUE_VALUES.map((forme) => (
                          <SelectItem key={forme} value={forme}>
                            {FORME_GALENIQUE_LABELS[forme]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DCI */}
              <FormField
                control={form.control}
                name="dci"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DCI (Dénomination Commune Internationale) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Paracétamol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nom commercial */}
              <FormField
                control={form.control}
                name="nomCommercial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom commercial *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doliprane" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dosage */}
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dosage *</FormLabel>
                    <FormControl>
                      <Input placeholder="500mg" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Exemples: 500mg, 10ml, 1g, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gestion du stock (optionnel) */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion du Stock (Optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Seuil minimum */}
              <FormField
                control={form.control}
                name="seuilMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seuil minimum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Alerte si stock &lt; seuil min
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seuil maximum */}
              <FormField
                control={form.control}
                name="seuilMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seuil maximum</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Capacité maximale de stock
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stock sécurité */}
              <FormField
                control={form.control}
                name="stockSecurite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock de sécurité</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Alerte critique si stock &lt; sécurité
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Si vous renseignez au moins un seuil, la gestion du stock sera activée pour ce médicament.
                Vous pourrez ensuite gérer les entrées/sorties dans le module Stocks.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/medicaments')}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Modifier' : 'Créer'} le médicament
          </Button>
        </div>
      </form>
    </Form>
  );
}
