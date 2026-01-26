import { z } from 'zod';

// Types pour Sexe et Groupe Sanguin
export const SEXE_VALUES = ['HOMME', 'FEMME'] as const;
export type Sexe = typeof SEXE_VALUES[number];

export const GROUPE_SANGUIN_VALUES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type GroupeSanguin = typeof GROUPE_SANGUIN_VALUES[number];

// Interface Patient (données API - structure backend)
export interface Patient {
  id: string; // UUID
  email: string;
  nom: string;
  prenom: string;
  matricule: string;
  dateNaissance: string; // ISO date string
  sexe: Sexe;
  telephone: string;
  direction: string;
  directionService?: string; // Le backend utilise ce champ
  service?: string;
  groupeSanguin?: GroupeSanguin;
  allergies?: string;
  antecedents?: string; // Le backend utilise 'antecedents' pas 'antecedentsMedicaux'
  antecedentsMedicaux?: string; // Alias pour le frontend
  userId?: string; // Liaison avec User
  createdAt: string;
  updatedAt: string;
}

// Schema de validation mot de passe fort (exporté pour réutilisation dans ChangePassword)
export const strongPasswordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>)');

// Schema pour création patient (SANS password - auto-généré par le backend)
export const patientCreateSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse email est requise')
    .email('Veuillez entrer une adresse email valide'),
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long (max 100)'),
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom est trop long (max 100)'),
  dateNaissance: z
    .string()
    .optional(),
  age: z
    .number({
      invalid_type_error: 'L\'âge doit être un nombre',
    })
    .int('L\'âge doit être un nombre entier')
    .min(0, 'L\'âge ne peut pas être négatif')
    .max(150, 'L\'âge doit être réaliste (max 150 ans)')
    .optional(),
  sexe: z.enum(SEXE_VALUES, {
    errorMap: () => ({ message: 'Le sexe est requis' }),
  }),
  telephone: z
    .string()
    .min(10, 'Le numéro de téléphone doit contenir 10 chiffres')
    .max(12, 'Le numéro de téléphone est trop long')
    .regex(/^01\d{8}$/, 'Le numéro doit commencer par 01 et contenir 10 chiffres (format: 01XXXXXXXX)'),
  directionService: z
    .string()
    .min(2, 'La direction ou le service est requis'),
  groupeSanguin: z
    .enum(GROUPE_SANGUIN_VALUES)
    .optional(),
  allergies: z
    .string()
    .optional(),
  antecedentsMedicaux: z
    .string()
    .optional(),
}).refine(
  (data) => data.dateNaissance || data.age !== undefined,
  {
    message: 'Vous devez fournir soit la date de naissance soit l\'âge',
    path: ['dateNaissance'],
  }
);

// Schema pour édition patient (tous les champs optionnels, sans age)
export const patientEditSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  nom: z
    .string()
    .min(2, 'Nom doit contenir au moins 2 caractères')
    .max(100, 'Nom trop long')
    .optional(),
  prenom: z
    .string()
    .min(2, 'Prénom doit contenir au moins 2 caractères')
    .max(100, 'Prénom trop long')
    .optional(),
  dateNaissance: z.string().optional(),
  sexe: z.enum(SEXE_VALUES).optional(),
  telephone: z
    .string()
    .min(10, 'Le numéro de téléphone doit contenir 10 chiffres')
    .max(12, 'Le numéro de téléphone est trop long')
    .regex(/^01\d{8}$/, 'Le numéro doit commencer par 01 et contenir 10 chiffres (format: 01XXXXXXXX)')
    .optional(),
  directionService: z
    .string()
    .min(2, 'La direction/service est requise')
    .optional(),
  groupeSanguin: z.enum(GROUPE_SANGUIN_VALUES).optional(),
  allergies: z.string().optional(),
  antecedentsMedicaux: z.string().optional(),
});

// Schema par défaut (pour compatibilité)
export const patientFormSchema = patientCreateSchema;

// Type pour les données du formulaire
export type PatientFormData = z.infer<typeof patientCreateSchema>;

// Type pour création patient (ce qui est RÉELLEMENT envoyé au backend)
export type CreatePatientDTO = {
  email: string;
  nom: string;
  prenom: string;
  dateNaissance?: string; // Optionnel si age est fourni
  age?: number; // Optionnel si dateNaissance est fourni
  sexe: Sexe;
  telephone: string;
  directionService: string;
  groupeSanguin?: GroupeSanguin;
  allergies?: string;
  antecedents?: Record<string, any>; // Backend utilise antecedents, pas antecedentsMedicaux
  antecedentsMedicaux?: string; // Alias frontend
  direction?: string; // Backward compatibility
  service?: string; // Backward compatibility
};

// Type pour mise à jour patient (champs optionnels, sans age)
export type UpdatePatientDTO = {
  email?: string; // Modification de l'email possible (déclenche un renvoi des identifiants)
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  sexe?: Sexe;
  telephone?: string;
  directionService?: string;
  groupeSanguin?: GroupeSanguin;
  allergies?: string;
  antecedents?: Record<string, any>;
  antecedentsMedicaux?: string;
  direction?: string;
  service?: string;
};

// Interface pour les filtres de recherche
export interface PatientFilters {
  search?: string; // Recherche par nom, prénom, matricule
  sexe?: Sexe;
  groupeSanguin?: GroupeSanguin;
  direction?: string;
  page?: number;
  limit?: number;
}

// Interface pour la réponse paginée (structure du backend réel)
export interface PatientsResponse {
  data: Patient[];
  page: number;
  total: number;
  totalPages: number;
}

// Helpers
export function getPatientFullName(patient: Patient): string {
  return `${patient.prenom} ${patient.nom}`;
}

export function getPatientAge(patient: Patient): number {
  const birthDate = new Date(patient.dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function formatPatientMatricule(matricule: string): string {
  return matricule.toUpperCase();
}
