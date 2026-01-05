// Énumérations et types
export const Role = {
  INFIRMIER: 'INFIRMIER',
  PATIENT: 'PATIENT',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Genre = {
  MASCULIN: 'Masculin',
  FEMININ: 'Féminin',
} as const;

export type Genre = (typeof Genre)[keyof typeof Genre];

export const TypeConsultation = {
  URGENTE: 'Urgente',
  NORMALE: 'Normale',
  CONTROLE: 'Contrôle',
} as const;

export type TypeConsultation = (typeof TypeConsultation)[keyof typeof TypeConsultation];

export const StatutRendezVous = {
  CONFIRME: 'Confirmé',
  EN_ATTENTE: 'En attente',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
} as const;

export type StatutRendezVous = (typeof StatutRendezVous)[keyof typeof StatutRendezVous];

export const TypeMouvement = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
} as const;

export type TypeMouvement = (typeof TypeMouvement)[keyof typeof TypeMouvement];

// Modèles principaux
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  isInfirmier: boolean;
  isPatient: boolean;
  patientId?: string; // Retourné par l'API login/me
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  genre: Genre;
  adresse?: string;
  telephone?: string;
  email?: string;
  lieuNaissance?: string;
  profession?: string;
  situationMatrimoniale?: string;
  nombreEnfants?: number;
  personneUrgence?: string;
  telephoneUrgence?: string;
  groupeSanguin?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  patient?: Patient;
  dateConsultation: string;
  motif: string;
  symptomes?: string;
  diagnostic?: string;
  traitement?: string;
  typeConsultation: TypeConsultation;
  constantes?: Constantes;
  prescriptions?: Prescription[];
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Constantes {
  temperature?: number;
  tensionArterielle?: string;
  pouls?: number;
  frequenceRespiratoire?: number;
  poids?: number;
  taille?: number;
  saturationOxygene?: number;
}

export interface Prescription {
  medicamentId: string;
  medicament?: Medicament;
  dosage: string;
  frequence: string;
  duree: string;
  quantite: number;
}

export interface Medicament {
  id: string;
  nom: string;
  dosage: string;
  forme: string;
  stockActuel: number;
  seuilAlerte: number;
  uniteMesure: string;
  createdAt: string;
  updatedAt: string;
}

export interface MouvementStock {
  id: string;
  medicamentId: string;
  medicament?: Medicament;
  type: TypeMouvement;
  quantite: number;
  motif?: string;
  dateMouvement: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: string;
  patientId: string;
  patient?: Patient;
  nomVaccin: string;
  dateVaccination: string;
  numeroDose?: number;
  rappel?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RendezVous {
  id: string;
  patientId: string;
  patient?: Patient;
  dateRendezVous: string;
  motif: string;
  statut: StatutRendezVous;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}
