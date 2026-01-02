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
  createdAt: string;
  updatedAt: string;
}

// Schema de base (champs communs)
const basePatientSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  nom: z
    .string()
    .min(2, 'Nom doit contenir au moins 2 caractères')
    .max(100, 'Nom trop long'),
  prenom: z
    .string()
    .min(2, 'Prénom doit contenir au moins 2 caractères')
    .max(100, 'Prénom trop long'),
  dateNaissance: z
    .string()
    .min(1, 'Date de naissance requise'),
  sexe: z.enum(SEXE_VALUES, {
    message: 'Sexe requis',
  }),
  telephone: z
    .string()
    .min(8, 'Téléphone invalide')
    .regex(/^[0-9+\s()-]+$/, 'Téléphone doit contenir uniquement des chiffres et symboles (+, -, (, ), espace)'),
  directionService: z
    .string()
    .min(2, 'La direction/service est requise'),
  groupeSanguin: z
    .enum(GROUPE_SANGUIN_VALUES)
    .optional(),
  allergies: z
    .string()
    .optional(),
  antecedentsMedicaux: z
    .string()
    .optional(),
});

// Schema de validation mot de passe fort (aligné avec backend)
const strongPasswordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>)');

// Schema pour création (avec password obligatoire)
export const patientCreateSchema = basePatientSchema.extend({
  password: strongPasswordSchema,
});

// Schema pour édition (tous les champs optionnels sauf email qui ne sera pas envoyé)
export const patientEditSchema = basePatientSchema.partial().extend({
  email: z.string().optional(), // Email en lecture seule, pas envoyé au backend
  password: z.string().optional(), // Pas de password en mode édition
});

// Schema par défaut (pour compatibilité)
export const patientFormSchema = patientCreateSchema;

// Type pour les données du formulaire
export type PatientFormData = z.infer<typeof patientCreateSchema>;

// Type pour création patient (sans ID)
export type CreatePatientDTO = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

// Type pour mise à jour patient (champs optionnels)
export type UpdatePatientDTO = Partial<CreatePatientDTO>;

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
