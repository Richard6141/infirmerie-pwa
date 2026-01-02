// ==================== VACCINATION ====================

export interface Vaccination {
  id: string;
  patientId: string;
  typeVaccin: string;
  date: string; // L'API utilise 'date' et non 'dateAdministration'
  dateAdministration?: string; // Gardé pour compatibilité, mais deprecated
  numeroLot?: string;
  prochainRappel?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  patient?: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  };
}

export interface CreateVaccinationData {
  patientId: string;
  typeVaccin: string;
  // La date n'est PAS envoyée - elle est générée automatiquement par le serveur
  numeroLot?: string;
  prochainRappel?: string;
  notes?: string; // Non documenté mais peut être accepté
}

export interface UpdateVaccinationData {
  typeVaccin?: string;
  date?: string; // L'API utilise 'date'
  numeroLot?: string;
  prochainRappel?: string;
  notes?: string;
}

// ==================== TYPES DE VACCINS COURANTS ====================

export const TYPES_VACCINS = [
  'COVID-19',
  'Grippe saisonnière',
  'Hépatite B',
  'Tétanos',
  'Diphtérie',
  'Poliomyélite',
  'Fièvre jaune',
  'Méningite',
  'Tuberculose (BCG)',
  'Rougeole',
  'Rubéole',
  'Oreillons',
  'Varicelle',
  'Papillomavirus (HPV)',
  'Pneumocoque',
  'Autre',
] as const;

// ==================== STATUT RAPPEL ====================

export type StatutRappel = 'URGENT' | 'PROCHE' | 'PLANIFIE' | 'EFFECTUE';

export const STATUT_RAPPEL_LABELS: Record<StatutRappel, string> = {
  URGENT: 'Urgent (dépassé)',
  PROCHE: 'Proche (< 30 jours)',
  PLANIFIE: 'Planifié',
  EFFECTUE: 'Effectué',
};

export const STATUT_RAPPEL_COLORS: Record<StatutRappel, string> = {
  URGENT: 'bg-red-100 text-red-800 border-red-300',
  PROCHE: 'bg-orange-100 text-orange-800 border-orange-300',
  PLANIFIE: 'bg-blue-100 text-blue-800 border-blue-300',
  EFFECTUE: 'bg-green-100 text-green-800 border-green-300',
};

// ==================== HELPERS ====================

/**
 * Détermine le statut d'un rappel en fonction de la date
 */
export function getStatutRappel(dateRappel: string): StatutRappel {
  const rappel = new Date(dateRappel);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const diffJours = Math.ceil((rappel.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));

  if (diffJours < 0) return 'URGENT';
  if (diffJours <= 30) return 'PROCHE';
  return 'PLANIFIE';
}

/**
 * Formatte une date de vaccination
 */
export function formaterDateVaccination(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Vérifie si un rappel est à venir dans les N jours
 */
export function isRappelDansNJours(dateRappel: string, jours: number): boolean {
  const rappel = new Date(dateRappel);
  const limite = new Date();
  limite.setDate(limite.getDate() + jours);

  return rappel <= limite;
}

// ==================== FILTRES ====================

export interface VaccinationFilters {
  search?: string; // Recherche patient
  typeVaccin?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface RappelFilters {
  typeVaccin?: string;
  statut?: StatutRappel;
  joursAvance?: number; // Nombre de jours à l'avance pour les rappels
}

// ==================== RESPONSE TYPES ====================

export interface VaccinationsResponse {
  data: Vaccination[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RappelVaccin {
  vaccinationId: string;
  patientId: string;
  nomPatient: string;
  typeVaccin: string;
  dateRappel: string;
  statut: StatutRappel;
  telephone?: string;
}

export interface RappelsResponse {
  data: RappelVaccin[];
  total: number;
}

// ==================== STATISTIQUES ====================

export interface StatistiquesVaccination {
  totalVaccinations: number;
  vaccinationsMoisEnCours: number;
  rappelsAVenir: number;
  rappelsUrgents: number;
  repartitionParType: Array<{
    typeVaccin: string;
    count: number;
    pourcentage: number;
  }>;
}
