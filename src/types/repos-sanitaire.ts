import { z } from 'zod';

// ==================== INTERFACES ====================

export interface ReposSanitaire {
  id: string;
  patientId: string;
  nomPatient: string;
  matriculePatient: string;
  sexePatient: string;
  agePatient: number;
  infirmierId: string;
  nomInfirmier: string;
  dateExamen: string;
  diagnosticFinal: string;
  soinsInstitues: string;
  dureeRepos: number;
  dateDebut: string;
  dateFin: string;
  dateControle?: string;
  lieuRedaction: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReposSanitaireData {
  patientId: string;
  dateExamen: string;
  diagnosticFinal: string;
  soinsInstitues: string;
  dureeRepos: number;
  dateDebut: string;
  dateFin: string;
  dateControle?: string;
  lieuRedaction?: string;
}

export interface UpdateReposSanitaireData {
  patientId?: string;
  dateExamen?: string;
  diagnosticFinal?: string;
  soinsInstitues?: string;
  dureeRepos?: number;
  dateDebut?: string;
  dateFin?: string;
  dateControle?: string;
  lieuRedaction?: string;
}

export interface ReposSanitaireFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ReposSanitaireResponse {
  data: ReposSanitaire[];
  page: number;
  total: number;
  totalPages: number;
}

// ==================== SCHEMAS ZOD ====================

export const createReposSanitaireSchema = z.object({
  patientId: z.string().uuid('Patient requis'),
  dateExamen: z.string().min(1, "Date d'examen requise"),
  diagnosticFinal: z
    .string()
    .min(5, 'Diagnostic requis (min 5 caractères)')
    .max(1000, 'Diagnostic trop long (max 1000 caractères)'),
  soinsInstitues: z
    .string()
    .min(5, 'Soins institués requis (min 5 caractères)')
    .max(1000, 'Soins trop longs (max 1000 caractères)'),
  dureeRepos: z
    .number()
    .int('Durée doit être un nombre entier')
    .min(1, 'Durée minimale: 1 jour')
    .max(365, 'Durée maximale: 365 jours'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  dateControle: z.string().optional(),
  lieuRedaction: z.string().optional(),
}).refine(
  (data) => {
    if (data.dateDebut && data.dateFin) {
      return new Date(data.dateFin) >= new Date(data.dateDebut);
    }
    return true;
  },
  {
    message: 'La date de fin doit être postérieure ou égale à la date de début',
    path: ['dateFin'],
  }
);

export type ReposSanitaireFormData = z.infer<
  typeof createReposSanitaireSchema
>;

// ==================== HELPERS ====================

/**
 * Calculer la date de fin à partir de la date de début et de la durée
 * @param dateDebut Date de début du repos
 * @param dureeJours Durée du repos en jours
 * @returns Date de fin au format YYYY-MM-DD
 */
export function calculerDateFin(
  dateDebut: string,
  dureeJours: number,
): string {
  const debut = new Date(dateDebut);
  debut.setDate(debut.getDate() + dureeJours - 1); // -1 car le premier jour compte
  return debut.toISOString().split('T')[0];
}

/**
 * Formater la durée en texte lisible
 * @param dureeJours Durée en jours
 * @returns Texte formaté (ex: "2 semaines et 3 jours")
 */
export function formaterDuree(dureeJours: number): string {
  if (dureeJours === 1) return '1 jour';
  if (dureeJours < 7) return `${dureeJours} jours`;

  const semaines = Math.floor(dureeJours / 7);
  const joursRestants = dureeJours % 7;

  if (joursRestants === 0) {
    return semaines === 1 ? '1 semaine' : `${semaines} semaines`;
  }

  return `${semaines} semaine${semaines > 1 ? 's' : ''} et ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`;
}

/**
 * Suggérer une date de contrôle (dateFin + quelques jours)
 * @param dateFin Date de fin du repos
 * @param joursApres Nombre de jours après la fin (défaut: 7)
 * @returns Date de contrôle suggérée au format YYYY-MM-DD
 */
export function suggererDateControle(
  dateFin: string,
  joursApres: number = 7,
): string {
  const fin = new Date(dateFin);
  fin.setDate(fin.getDate() + joursApres);
  return fin.toISOString().split('T')[0];
}

/**
 * Formater une date pour l'affichage
 * @param date Date au format ISO
 * @returns Date formatée (ex: "15 janvier 2026")
 */
export function formaterDateRepos(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formater le sexe pour affichage
 * @param sexe Sexe du patient
 * @returns "M." ou "Mme/Mlle"
 */
export function formaterSexe(sexe: string): string {
  return sexe === 'MASCULIN' ? 'M.' : 'Mme/Mlle';
}
