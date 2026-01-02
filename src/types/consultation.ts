import { z } from 'zod';
import type { Medicament } from './medicament';

// ==================== INTERFACES ====================

// Constantes vitales (correspond à l'API backend)
export interface ConstantesVitales {
  temperature?: number; // °C (35-42)
  tensionSystolique?: number; // mmHg (50-250)
  tensionDiastolique?: number; // mmHg (30-150)
  frequenceCardiaque?: number; // bpm (30-200)
  frequenceRespiratoire?: number; // cycles/min (8-40)
  saturationOxygene?: number; // % (70-100)
  poids?: number; // kg (1-300)
  taille?: number; // cm (50-250)
}

// Prescription
export interface Prescription {
  id: string;
  medicamentId: string;
  medicament?: Medicament;
  posologie: string;
  duree: string;
  createdAt: string;
  updatedAt: string;
}

// Consultation complète (réponse API)
export interface Consultation {
  id: string;
  patientId: string;
  nomPatient: string;
  matriculePatient: string;
  infirmierId: string;
  nomInfirmier: string;
  date: string; // ISO date string
  motif: string;
  constantesVitales: ConstantesVitales;
  examenClinique?: string;
  diagnostic?: string;
  observations?: string;
  prochainRDV?: string; // ISO date string
  prescriptions: Prescription[];
  createdAt: string;
  updatedAt: string;
}

// Données pour création de prescription
export interface CreatePrescriptionData {
  medicamentId: string;
  posologie: string;
  duree: string;
}

// Données pour création de consultation
export interface CreateConsultationData {
  patientId: string;
  motif: string;
  constantesVitales: ConstantesVitales;
  examenClinique?: string;
  diagnostic?: string;
  observations?: string;
  prochainRDV?: string;
  prescriptions?: CreatePrescriptionData[];
}

// Filtres pour liste consultations
export interface ConsultationFilters {
  patientId?: string;
  search?: string; // Recherche par nom de patient
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Réponse paginée
export interface ConsultationsResponse {
  data: Consultation[];
  page: number;
  total: number;
  totalPages: number;
}

// ==================== SCHEMAS ZOD ====================

// Schema constantes vitales
export const constantesVitalesSchema = z.object({
  temperature: z
    .number()
    .min(35, 'Température minimale: 35°C')
    .max(42, 'Température maximale: 42°C')
    .optional(),
  tensionSystolique: z
    .number()
    .min(50, 'Tension systolique minimale: 50 mmHg')
    .max(250, 'Tension systolique maximale: 250 mmHg')
    .optional(),
  tensionDiastolique: z
    .number()
    .min(30, 'Tension diastolique minimale: 30 mmHg')
    .max(150, 'Tension diastolique maximale: 150 mmHg')
    .optional(),
  frequenceCardiaque: z
    .number()
    .min(30, 'Fréquence cardiaque minimale: 30 bpm')
    .max(200, 'Fréquence cardiaque maximale: 200 bpm')
    .optional(),
  frequenceRespiratoire: z
    .number()
    .min(8, 'Fréquence respiratoire minimale: 8 cycles/min')
    .max(40, 'Fréquence respiratoire maximale: 40 cycles/min')
    .optional(),
  saturationOxygene: z
    .number()
    .min(70, 'Saturation minimale: 70%')
    .max(100, 'Saturation maximale: 100%')
    .optional(),
  poids: z
    .number()
    .positive('Le poids doit être positif')
    .max(300, 'Poids maximal: 300 kg')
    .optional(),
  taille: z
    .number()
    .min(50, 'Taille minimale: 50 cm')
    .max(250, 'Taille maximale: 250 cm')
    .optional(),
});

// Schema prescription
export const prescriptionSchema = z.object({
  medicamentId: z.string().uuid('ID médicament invalide'),
  posologie: z.string().min(3, 'Posologie requise (min 3 caractères)'),
  duree: z.string().min(2, 'Durée requise (ex: 7 jours)'),
});

// Schema création consultation
export const createConsultationSchema = z.object({
  patientId: z.string().uuid('ID patient invalide'),
  motif: z.string().min(5, 'Motif requis (min 5 caractères)'),
  constantesVitales: constantesVitalesSchema,
  examenClinique: z.string().optional(),
  diagnostic: z.string().optional(),
  observations: z.string().optional(),
  prochainRDV: z.string().optional(),
  prescriptions: z.array(prescriptionSchema).optional(),
});

// Schema édition consultation
export const updateConsultationSchema = createConsultationSchema.partial().omit({ patientId: true });

// Type form data
export type ConsultationFormData = z.infer<typeof createConsultationSchema>;

// ==================== HELPERS ====================

// Calcul IMC (Indice de Masse Corporelle)
export function calculerIMC(poids?: number, taille?: number): number | null {
  if (!poids || !taille) return null;
  const tailleEnMetres = taille / 100;
  const imc = poids / (tailleEnMetres * tailleEnMetres);
  return Math.round(imc * 10) / 10; // Arrondi 1 décimale
}

// Interprétation IMC
export function interpreterIMC(imc: number): string {
  if (imc < 18.5) return 'Insuffisance pondérale';
  if (imc < 25) return 'Corpulence normale';
  if (imc < 30) return 'Surpoids';
  if (imc < 35) return 'Obésité modérée';
  if (imc < 40) return 'Obésité sévère';
  return 'Obésité morbide';
}

// Formater tension artérielle
export function formaterTensionArterielle(systolique?: number, diastolique?: number): string {
  if (!systolique || !diastolique) return '-';
  return `${systolique}/${diastolique} mmHg`;
}

// Formater date consultation
export function formaterDateConsultation(date: string): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Obtenir nom complet patient (helper)
export function getConsultationPatientName(consultation: Consultation): string {
  return consultation.nomPatient;
}

// Formater constantes vitales pour affichage
export function formaterConstantesVitales(constantes: ConstantesVitales): string {
  const parts: string[] = [];

  if (constantes.temperature) {
    parts.push(`T°: ${constantes.temperature}°C`);
  }
  if (constantes.tensionSystolique && constantes.tensionDiastolique) {
    parts.push(`TA: ${formaterTensionArterielle(constantes.tensionSystolique, constantes.tensionDiastolique)}`);
  }
  if (constantes.frequenceCardiaque) {
    parts.push(`FC: ${constantes.frequenceCardiaque} bpm`);
  }
  if (constantes.saturationOxygene) {
    parts.push(`SpO2: ${constantes.saturationOxygene}%`);
  }
  if (constantes.poids && constantes.taille) {
    const imc = calculerIMC(constantes.poids, constantes.taille);
    parts.push(`IMC: ${imc}`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'Non renseignées';
}
