import { z } from 'zod';

// ==================== ENUMS & CONSTANTS ====================

export const STATUT_RDV_VALUES = ['PLANIFIE', 'CONFIRME', 'ANNULE', 'TERMINE'] as const;
export type StatutRendezVous = typeof STATUT_RDV_VALUES[number];

export const STATUT_RDV_LABELS: Record<StatutRendezVous, string> = {
  PLANIFIE: 'Planifié',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
};

export const STATUT_RDV_COLORS: Record<StatutRendezVous, string> = {
  PLANIFIE: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRME: 'bg-green-100 text-green-800 border-green-200',
  ANNULE: 'bg-red-100 text-red-800 border-red-200',
  TERMINE: 'bg-slate-100 text-slate-800 border-slate-200',
};

// ==================== INTERFACES ====================


// Rendez-vous complet (réponse API)
// Basé sur la documentation officielle de l'API
export interface RendezVous {
  id: string;
  patientId: string;
  nomPatient: string; // Format: "Nom Prenom" (ex: "Dupont Jean")
  matriculePatient: string;
  dateHeure: string; // ISO date string
  motif: string;
  statut: StatutRendezVous;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Données pour création de rendez-vous
export interface CreateRendezVousData {
  patientId: string;
  dateHeure: string; // ISO date string
  motif: string;
  statut?: StatutRendezVous; // Défaut: PLANIFIE
  notes?: string;
}

// Données pour mise à jour de rendez-vous
export interface UpdateRendezVousData {
  dateHeure?: string;
  motif?: string;
  statut?: StatutRendezVous;
  notes?: string;
}

// Filtres pour liste rendez-vous
export interface RendezVousFilters {
  search?: string;
  patientId?: string;
  statut?: StatutRendezVous;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  page?: number;
  limit?: number;
}

// Réponse paginée
export interface RendezVousResponse {
  data: RendezVous[];
  page: number;
  total: number;
  totalPages: number;
}

// ==================== SCHEMAS ZOD ====================

// Schema création rendez-vous
export const createRendezVousSchema = z.object({
  patientId: z.string().uuid('Veuillez sélectionner un patient valide'),
  dateHeure: z.string().min(1, 'La date et l\'heure sont requises'),
  motif: z.string().min(5, 'Le motif est requis (min 5 caractères)'),
  statut: z.enum(STATUT_RDV_VALUES).optional(),
  notes: z.string().optional(),
});

// Schema mise à jour rendez-vous
export const updateRendezVousSchema = createRendezVousSchema.partial().omit({ patientId: true });

// Type form data
export type RendezVousFormData = z.infer<typeof createRendezVousSchema>;

// ==================== HELPERS ====================

// Obtenir le nom complet du patient
export function getNomCompletPatient(rdv: RendezVous): string {
  return rdv.nomPatient || 'Patient inconnu';
}

// Obtenir le matricule du patient
export function getMatriculePatient(rdv: RendezVous): string {
  return rdv.matriculePatient || 'N/A';
}

// Obtenir le nom complet de l'infirmier (placeholder - l'API ne retourne pas ce champ)
export function getNomCompletInfirmier(_rdv: RendezVous): string {
  return 'Infirmier';
}

// Obtenir les notes
export function getObservations(rdv: RendezVous): string | undefined {
  return rdv.notes;
}

// Formater date rendez-vous
export function formaterDateRendezVous(date: string): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Formater date courte (sans heure)
export function formaterDateCourte(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Formater heure
export function formaterHeure(date: string): string {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Vérifier si RDV est aujourd'hui
export function isRendezVousToday(date: string): boolean {
  const rdvDate = new Date(date);
  const today = new Date();
  return (
    rdvDate.getDate() === today.getDate() &&
    rdvDate.getMonth() === today.getMonth() &&
    rdvDate.getFullYear() === today.getFullYear()
  );
}

// Vérifier si RDV est passé
export function isRendezVousPasse(date: string): boolean {
  return new Date(date) < new Date();
}

// Obtenir les RDV à venir (7 prochains jours)
export function getRendezVousAVenir(rendezVous: RendezVous[]): RendezVous[] {
  const now = new Date();
  const dans7Jours = new Date();
  dans7Jours.setDate(dans7Jours.getDate() + 7);

  return rendezVous
    .filter((rdv) => {
      const rdvDate = new Date(rdv.dateHeure);
      return rdvDate >= now && rdvDate <= dans7Jours && rdv.statut !== 'ANNULE';
    })
    .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
}

// Obtenir les RDV du jour
export function getRendezVousDuJour(rendezVous: RendezVous[]): RendezVous[] {
  return rendezVous
    .filter((rdv) => isRendezVousToday(rdv.dateHeure) && rdv.statut !== 'ANNULE')
    .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
}
