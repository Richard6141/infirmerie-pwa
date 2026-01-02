import type {
  User,
  Patient,
  Consultation,
  Medicament,
  MouvementStock,
  Vaccination,
  RendezVous,
} from './models';

// Types de réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Authentification
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;  // Le backend utilise camelCase
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: string;
}

// Patients
export interface CreatePatientRequest {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  genre: string;
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
}

export type UpdatePatientRequest = Partial<CreatePatientRequest>;

// Consultations
export interface CreateConsultationRequest {
  patientId: string;
  dateConsultation: string;
  motif: string;
  symptomes?: string;
  diagnostic?: string;
  traitement?: string;
  typeConsultation: string;
  constantes?: {
    temperature?: number;
    tensionArterielle?: string;
    pouls?: number;
    frequenceRespiratoire?: number;
    poids?: number;
    taille?: number;
    saturationOxygene?: number;
  };
  prescriptions?: Array<{
    medicamentId: string;
    dosage: string;
    frequence: string;
    duree: string;
    quantite: number;
  }>;
  observations?: string;
}

export type UpdateConsultationRequest = Partial<CreateConsultationRequest>;

// Médicaments
export interface CreateMedicamentRequest {
  nom: string;
  dosage: string;
  forme: string;
  stockActuel: number;
  seuilAlerte: number;
  uniteMesure: string;
}

export type UpdateMedicamentRequest = Partial<CreateMedicamentRequest>;

// Mouvements de stock
export interface CreateMouvementStockRequest {
  medicamentId: string;
  type: string;
  quantite: number;
  motif?: string;
}

// Vaccinations
export interface CreateVaccinationRequest {
  patientId: string;
  nomVaccin: string;
  dateVaccination: string;
  numeroDose?: number;
  rappel?: string;
  observations?: string;
}

export type UpdateVaccinationRequest = Partial<CreateVaccinationRequest>;

// Rendez-vous
export interface CreateRendezVousRequest {
  patientId: string;
  dateRendezVous: string;
  motif: string;
  statut: string;
  observations?: string;
}

export type UpdateRendezVousRequest = Partial<CreateRendezVousRequest>;

// Sync offline
export interface SyncData {
  patients: Patient[];
  consultations: Consultation[];
  medicaments: Medicament[];
  vaccinations: Vaccination[];
  rendezVous: RendezVous[];
  mouvementsStock: MouvementStock[];
  lastSyncTimestamp: string;
}

export interface SyncPushRequest {
  operations: SyncOperation[];
}

export interface SyncOperation {
  id: string;
  entity: 'patient' | 'consultation' | 'vaccination' | 'rendezVous' | 'medicament' | 'mouvementStock';
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  tempId?: string;
  timestamp: string;
}

export interface SyncConflict {
  operationId: string;
  entity: string;
  tempId?: string;
  conflict: {
    local: unknown;
    remote: unknown;
    field: string;
  };
}

export interface SyncPushResponse {
  success: boolean;
  conflicts?: SyncConflict[];
  mapping?: Record<string, string>;
}
