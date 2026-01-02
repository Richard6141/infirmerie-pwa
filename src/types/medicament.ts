import { z } from 'zod';

// ==================== ENUMS ====================

// Forme galénique (correspond à l'enum Prisma backend)
export const FORME_GALENIQUE_VALUES = [
  'COMPRIME',
  'GELULE',
  'SIROP',
  'INJECTABLE',
  'POMMADE',
  'CREME',
  'SUPPOSITOIRE',
] as const;

export type FormeGalenique = typeof FORME_GALENIQUE_VALUES[number];

// Labels français pour les formes
export const FORME_GALENIQUE_LABELS: Record<FormeGalenique, string> = {
  COMPRIME: 'Comprimé',
  GELULE: 'Gélule',
  SIROP: 'Sirop',
  INJECTABLE: 'Injectable',
  POMMADE: 'Pommade',
  CREME: 'Crème',
  SUPPOSITOIRE: 'Suppositoire',
};

// ==================== INTERFACES ====================

// Informations de stock (correspond à StockInfoDto backend)
export interface StockInfo {
  id: string;
  quantiteActuelle: number;
  seuilMin: number;
  seuilMax: number;
  stockSecurite: number;
  updatedAt: string;
}

// Médicament complet (réponse API - MedicamentResponseDto)
export interface Medicament {
  id: string;
  code: string; // Code unique (ex: MED-2024-001)
  dci: string; // Dénomination Commune Internationale
  nomCommercial: string;
  forme: FormeGalenique;
  dosage: string; // ex: "500mg"
  stock?: StockInfo; // Informations de stock (optionnel)
  createdAt: string;
  updatedAt: string;
}

// Données pour création de médicament
export interface CreateMedicamentData {
  code: string;
  dci: string;
  nomCommercial: string;
  forme: FormeGalenique;
  dosage: string;
  seuilMin?: number; // Si fourni, crée le stock
  seuilMax?: number;
  stockSecurite?: number;
}

// Données pour mise à jour de médicament
export interface UpdateMedicamentData {
  dci?: string;
  nomCommercial?: string;
  forme?: FormeGalenique;
  dosage?: string;
}

// Filtres pour liste médicaments
export interface MedicamentFilters {
  search?: string; // Recherche par code, DCI ou nom commercial
  forme?: FormeGalenique;
  stockBas?: boolean; // Filtrer médicaments avec stock < seuilMin
  page?: number;
  limit?: number;
}

// Réponse paginée
export interface MedicamentsResponse {
  data: Medicament[];
  page: number;
  total: number;
  totalPages: number;
}

// ==================== SCHEMAS ZOD ====================

// Schema création médicament
export const createMedicamentSchema = z.object({
  code: z
    .string()
    .min(1, 'Code requis')
    .max(50, 'Code trop long')
    .regex(/^[A-Z0-9-]+$/, 'Code: majuscules, chiffres et tirets uniquement'),
  dci: z
    .string()
    .min(2, 'DCI: minimum 2 caractères')
    .max(200, 'DCI trop long'),
  nomCommercial: z
    .string()
    .min(2, 'Nom commercial: minimum 2 caractères')
    .max(200, 'Nom trop long'),
  forme: z.enum(FORME_GALENIQUE_VALUES, {
    message: 'Forme galénique requise',
  }),
  dosage: z
    .string()
    .min(1, 'Dosage requis')
    .max(100, 'Dosage trop long'),
  seuilMin: z.number().min(0, 'Seuil minimum ne peut être négatif').optional(),
  seuilMax: z.number().min(0, 'Seuil maximum ne peut être négatif').optional(),
  stockSecurite: z.number().min(0, 'Stock sécurité ne peut être négatif').optional(),
});

// Schema mise à jour médicament
export const updateMedicamentSchema = createMedicamentSchema.partial().omit({ code: true });

// Type form data
export type MedicamentFormData = z.infer<typeof createMedicamentSchema>;

// ==================== HELPERS ====================

// Statut du stock
export function getStockStatus(medicament: Medicament): 'NORMAL' | 'BAS' | 'CRITIQUE' | 'RUPTURE' | 'INCONNU' {
  if (!medicament.stock) return 'INCONNU';

  const { quantiteActuelle, seuilMin, stockSecurite } = medicament.stock;

  if (quantiteActuelle === 0) return 'RUPTURE';
  if (quantiteActuelle <= stockSecurite) return 'CRITIQUE';
  if (quantiteActuelle <= seuilMin) return 'BAS';
  return 'NORMAL';
}

// Couleur badge selon statut
export function getStockBadgeColor(status: ReturnType<typeof getStockStatus>): string {
  switch (status) {
    case 'NORMAL':
      return 'bg-green-500 text-white';
    case 'BAS':
      return 'bg-yellow-500 text-white';
    case 'CRITIQUE':
      return 'bg-orange-500 text-white';
    case 'RUPTURE':
      return 'bg-red-500 text-white';
    case 'INCONNU':
      return 'bg-gray-400 text-white';
  }
}

// Label statut stock
export function getStockStatusLabel(status: ReturnType<typeof getStockStatus>): string {
  switch (status) {
    case 'NORMAL':
      return 'Stock normal';
    case 'BAS':
      return 'Stock bas';
    case 'CRITIQUE':
      return 'Stock critique';
    case 'RUPTURE':
      return 'Rupture';
    case 'INCONNU':
      return 'Non géré';
  }
}

// Formater affichage médicament
export function formatMedicamentDisplay(medicament: Medicament): string {
  return `${medicament.nomCommercial} (${medicament.dci}) - ${medicament.dosage}`;
}

// Formater affichage médicament court (pour autocomplete)
export function formatMedicamentShort(medicament: Medicament): string {
  return `${medicament.nomCommercial} ${medicament.dosage}`;
}

// Obtenir quantité en stock
export function getQuantiteStock(medicament: Medicament): number {
  return medicament.stock?.quantiteActuelle ?? 0;
}

// Vérifier si stock est géré
export function hasStockManagement(medicament: Medicament): boolean {
  return !!medicament.stock;
}
