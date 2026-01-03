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
// import { Textarea } from '@/components/ui/textarea'; // Unused
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreatePatient, useUpdatePatient } from '@/lib/hooks/usePatients';
import { usePatientSuggestions } from '@/lib/hooks/usePatientSuggestions';
import {
  patientCreateSchema,
  patientEditSchema,
  type PatientFormData,
  type Patient,
  SEXE_VALUES,
  GROUPE_SANGUIN_VALUES,
} from '@/types/patient';
import { toast } from 'sonner';

interface PatientFormProps {
  patient?: Patient; // Si fourni, mode édition
  onSuccess?: () => void;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!patient;

  // State pour choisir entre Date de Naissance ou Âge (uniquement en mode création)
  const [useAge, setUseAge] = useState(false);

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const { data: suggestions } = usePatientSuggestions();

  // Fonction helper pour convertir antecedents (objet ou string) en string
  const getAntecedentsString = (antecedents: any): string => {
    if (!antecedents) return '';
    if (typeof antecedents === 'string') return antecedents;

    if (typeof antecedents === 'object') {
      // Si c'est un array à la racine
      if (Array.isArray(antecedents)) {
        return antecedents.join(', ');
      }

      // Si on a un champ "autres" (notre format simplifié), l'utiliser directement
      if (antecedents.autres) {
        if (Array.isArray(antecedents.autres)) {
          return antecedents.autres.join(', ');
        }
        if (typeof antecedents.autres === 'string') {
          return antecedents.autres;
        }
      }

      // Structure backend complète: { diabete: true, chirurgies: ["appendicectomie 2015"], hypertension: false }
      const parts: string[] = [];

      Object.entries(antecedents).forEach(([key, val]) => {
        // Ignorer le champ "autres" car déjà traité
        if (key === 'autres') return;

        // Si c'est un boolean true, ajouter le nom de la maladie
        if (typeof val === 'boolean' && val === true) {
          // Capitaliser la première lettre
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          parts.push(label);
        }
        // Si c'est un array, extraire les valeurs
        else if (Array.isArray(val) && val.length > 0) {
          parts.push(...val.filter(v => typeof v === 'string'));
        }
        // Si c'est une string non vide
        else if (typeof val === 'string' && val.length > 0) {
          parts.push(val);
        }
      });

      return parts.join(', ');
    }

    return '';
  };

  // Fonction helper pour convertir groupe sanguin du backend vers le form
  const transformGroupeSanguinFromBackend = (groupe?: string): string | undefined => {
    if (!groupe) return undefined;
    // Transformer O_POSITIF → O+, O_NEGATIF → O-, etc.
    return groupe.replace('_POSITIF', '+').replace('_NEGATIF', '-');
  };

  // Fonction helper pour convertir sexe du backend vers le form
  const transformSexeFromBackend = (sexe: string): 'HOMME' | 'FEMME' => {
    // Le backend utilise MASCULIN/FEMININ, le form utilise HOMME/FEMME
    return sexe === 'MASCULIN' ? 'HOMME' : 'FEMME';
  };

  // Valeurs par défaut du formulaire
  const defaultValues: Partial<PatientFormData> = patient
    ? {
        email: patient.email || '',
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        dateNaissance: patient.dateNaissance.split('T')[0], // Format YYYY-MM-DD
        sexe: transformSexeFromBackend(patient.sexe),
        telephone: patient.telephone || '',
        directionService: patient.directionService || patient.direction || patient.service || '',
        groupeSanguin: transformGroupeSanguinFromBackend(patient.groupeSanguin) || undefined,
        allergies: patient.allergies || '',
        // Le backend utilise 'antecedents' comme objet, on le convertit en string
        antecedentsMedicaux: getAntecedentsString(patient.antecedents || patient.antecedentsMedicaux) || '',
      }
    : {
        email: '',
        nom: '',
        prenom: '',
        dateNaissance: '',
        age: undefined,
        sexe: 'HOMME',
        telephone: '',
        directionService: '',
        groupeSanguin: undefined,
        allergies: '',
        antecedentsMedicaux: '',
      };

  const form = useForm<PatientFormData>({
    resolver: zodResolver(isEditMode ? patientEditSchema : patientCreateSchema) as any, // Type cast to bypass strict type checking
    defaultValues,
  });

  // Réinitialiser le formulaire quand les données du patient changent
  useEffect(() => {
    if (patient) {
      form.reset({
        email: patient.email || '',
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        dateNaissance: patient.dateNaissance.split('T')[0],
        sexe: transformSexeFromBackend(patient.sexe),
        telephone: patient.telephone || '',
        directionService: patient.directionService || patient.direction || patient.service || '',
        groupeSanguin: transformGroupeSanguinFromBackend(patient.groupeSanguin) || undefined,
        allergies: patient.allergies || '',
        antecedentsMedicaux: getAntecedentsString(patient.antecedents || patient.antecedentsMedicaux) || '',
      } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, patient?.updatedAt]); // Se déclenche uniquement si le patient change

  const onSubmit = async (data: PatientFormData) => {
    console.log('[PatientForm] 🔵 FORM SUBMIT STARTED');
    console.log('[PatientForm] Form data:', data);

    try {
      // Fonction pour transformer le groupe sanguin (O+ → O_POSITIF)
      const transformGroupeSanguin = (groupe?: string) => {
        if (!groupe) return undefined;
        return groupe.replace('+', '_POSITIF').replace('-', '_NEGATIF');
      };

      // Fonction pour convertir la string antecedents en objet pour le backend
      const convertAntecedentsToBackend = (antecedentsString?: string): Record<string, any> | undefined => {
        if (!antecedentsString || antecedentsString.trim() === '') return undefined;

        // Pour l'instant, stocker dans un champ générique "autres"
        // TODO: Parser intelligemment pour détecter diabete, hypertension, chirurgies, etc.
        return {
          autres: antecedentsString.split(',').map(s => s.trim()).filter(Boolean),
        };
      };

      // Transformer les données pour le backend
      const backendData: any = {
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        // Le backend utilise 'sexe' avec MASCULIN/FEMININ (majuscules)
        sexe: data.sexe === 'HOMME' ? 'MASCULIN' : 'FEMININ',
        telephone: data.telephone,
        directionService: data.directionService,
        groupeSanguin: transformGroupeSanguin(data.groupeSanguin),
        allergies: data.allergies || undefined,
        antecedents: convertAntecedentsToBackend(data.antecedentsMedicaux),
      };

      // En mode création, ajouter email (le password est auto-généré par le backend)
      if (!isEditMode) {
        backendData.email = data.email;
        // Ajouter age si fourni (au lieu de dateNaissance)
        if (data.age !== undefined) {
          backendData.age = data.age;
          delete backendData.dateNaissance; // Ne pas envoyer dateNaissance si age est fourni
        }
      }

      console.log('[PatientForm] 📦 Backend data prepared:', backendData);
      console.log('[PatientForm] isEditMode:', isEditMode);
      console.log('[PatientForm] About to call mutation...');

      if (isEditMode) {
        console.log('[PatientForm] Calling UPDATE mutation...');
        await updateMutation.mutateAsync({
          id: patient.id,
          data: backendData,
        });
        console.log('[PatientForm] ✅ UPDATE mutation completed');
        toast.success('Patient modifié avec succès');
      } else {
        console.log('[PatientForm] Calling CREATE mutation...');
        await createMutation.mutateAsync(backendData);
        console.log('[PatientForm] ✅ CREATE mutation completed');
        toast.success('Patient créé avec succès');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/patients');
      }
    } catch (error: any) {
      console.error('[PatientForm] ❌ Error in onSubmit:', error);
      toast.error(
        error?.response?.data?.message ||
        `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} du patient`
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log('[PatientForm] Form submit event triggered');
          console.log('[PatientForm] Form errors:', form.formState.errors);
          console.log('[PatientForm] Form values:', form.getValues());
          form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-8">
        {/* Informations Personnelles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informations Personnelles</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email {!isEditMode && '*'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="exemple@ministere.gov"
                      {...field}
                      disabled={isEditMode}
                      className={isEditMode ? 'bg-slate-100 cursor-not-allowed' : ''}
                    />
                  </FormControl>
                  {isEditMode && (
                    <FormDescription className="text-xs text-slate-500">
                      L'email ne peut pas être modifié
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nom */}
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de famille" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prénom */}
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date de naissance ou Âge */}
            {!isEditMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Date de Naissance / Âge *
                </label>
                <RadioGroup
                  value={useAge ? 'age' : 'date'}
                  onValueChange={(value) => {
                    setUseAge(value === 'age');
                    // Réinitialiser le champ non utilisé
                    if (value === 'age') {
                      form.setValue('dateNaissance', '');
                    } else {
                      form.setValue('age', undefined);
                    }
                  }}
                  className="flex gap-4 mb-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="use-date" />
                    <label htmlFor="use-date" className="font-normal cursor-pointer text-sm">
                      Date de naissance
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="age" id="use-age" />
                    <label htmlFor="use-age" className="font-normal cursor-pointer text-sm">
                      Âge
                    </label>
                  </div>
                </RadioGroup>

                {!useAge ? (
                  <FormField
                    control={form.control}
                    name="dateNaissance"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 25"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? undefined : parseInt(value, 10));
                            }}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          La date de naissance sera calculée au 1er janvier
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* En mode édition, afficher seulement la date de naissance */}
            {isEditMode && (
              <FormField
                control={form.control}
                name="dateNaissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de Naissance *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Sexe */}
            <FormField
              control={form.control}
              name="sexe"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Sexe *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      {SEXE_VALUES.map((sexe) => (
                        <FormItem key={sexe} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={sexe} />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {sexe === 'HOMME' ? 'Homme' : 'Femme'}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Téléphone */}
            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone *</FormLabel>
                  <FormControl>
                    <Input placeholder="+237 6XX XX XX XX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Groupe Sanguin */}
            <FormField
              control={form.control}
              name="groupeSanguin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Groupe Sanguin</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Sélectionner un groupe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {GROUPE_SANGUIN_VALUES.map((groupe) => (
                        <SelectItem key={groupe} value={groupe}>
                          {groupe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informations Professionnelles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informations Professionnelles</h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Direction / Service */}
            <FormField
              control={form.control}
              name="directionService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction / Service *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Direction des Ressources Humaines - Service Administratif"
                      list="directions-list"
                      {...field}
                    />
                  </FormControl>
                  <datalist id="directions-list">
                    {suggestions?.directions.map((dir) => (
                      <option key={dir} value={dir} />
                    ))}
                  </datalist>
                  <FormDescription>
                    Indiquez la direction et le service du patient (suggestionautocomplete)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informations Médicales */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informations Médicales</h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Allergies */}
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Pénicilline, Arachides (autocomplete disponible)"
                      list="allergies-list"
                      {...field}
                    />
                  </FormControl>
                  <datalist id="allergies-list">
                    {suggestions?.allergies.map((allergie) => (
                      <option key={allergie} value={allergie} />
                    ))}
                  </datalist>
                  <FormDescription className="text-xs">
                    Séparez les allergies par des virgules
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Antécédents Médicaux */}
            <FormField
              control={form.control}
              name="antecedentsMedicaux"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antécédents Médicaux</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Diabète, Hypertension (autocomplete disponible)"
                      list="antecedents-list"
                      {...field}
                    />
                  </FormControl>
                  <datalist id="antecedents-list">
                    {suggestions?.antecedents.map((antecedent) => (
                      <option key={antecedent} value={antecedent} />
                    ))}
                  </datalist>
                  <FormDescription className="text-xs">
                    Séparez les antécédents par des virgules
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log('🧪 [TEST BUTTON] This button works!');
              console.log('🧪 [TEST] isLoading:', isLoading);
              console.log('🧪 [TEST] createMutation.isPending:', createMutation.isPending);
            }}
          >
            🧪 Test Console
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/patients')}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Modifier' : 'Créer'} le patient
          </Button>
        </div>
      </form>
    </Form>
  );
}
