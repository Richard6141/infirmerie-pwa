// ==================== MOUVEMENT STOCK ====================

export const TYPE_MOUVEMENT_VALUES = ['ENTREE', 'SORTIE', 'AJUSTEMENT'] as const;
export type TypeMouvement = typeof TYPE_MOUVEMENT_VALUES[number];

export const TYPE_MOUVEMENT_LABELS: Record<TypeMouvement, string> = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
  AJUSTEMENT: 'Ajustement',
};

export const TYPE_MOUVEMENT_COLORS: Record<TypeMouvement, string> = {
  ENTREE: 'bg-green-100 text-green-800 border-green-200',
  SORTIE: 'bg-red-100 text-red-800 border-red-200',
  AJUSTEMENT: 'bg-blue-100 text-blue-800 border-blue-200',
};

export interface MouvementStock {
  id: string;
  medicamentId: string;
  type: TypeMouvement;
  quantite: number;
  quantiteAvant: number;
  quantiteApres: number;
  motif?: string;
  numeroLot?: string;
  dateExpiration?: string;
  createdAt: string;
  updatedAt: string;

  // Champs plats retournés par certains endpoints
  codeMedicament?: string;
  nomMedicament?: string;

  // Relations
  medicament?: {
    id: string;
    code: string;
    nomCommercial: string;
    dci: string;
  };
}

export interface CreateMouvementStockData {
  medicamentId: string;
  type: TypeMouvement;
  quantite: number;
  motif?: string;
  numeroLot?: string;
  dateExpiration?: string;
}

// ==================== CONFIGURATION STOCK ====================

export interface ConfigurationStock {
  medicamentId: string;
  quantiteActuelle: number;
  seuilMin: number;
  seuilMax: number;
  stockSecurite?: number;
}

export interface UpdateConfigurationStockData {
  seuilMin?: number;
  seuilMax?: number;
  stockSecurite?: number;
}

// ==================== STATUT STOCK ====================

export type StatutStock = 'RUPTURE' | 'CRITIQUE' | 'BAS' | 'NORMAL' | 'HAUT';

export const STATUT_STOCK_LABELS: Record<StatutStock, string> = {
  RUPTURE: 'Rupture de stock',
  CRITIQUE: 'Stock critique',
  BAS: 'Stock bas',
  NORMAL: 'Stock normal',
  HAUT: 'Stock élevé',
};

export const STATUT_STOCK_COLORS: Record<StatutStock, string> = {
  RUPTURE: 'bg-red-100 text-red-800 border-red-300',
  CRITIQUE: 'bg-orange-100 text-orange-800 border-orange-300',
  BAS: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  NORMAL: 'bg-green-100 text-green-800 border-green-300',
  HAUT: 'bg-blue-100 text-blue-800 border-blue-300',
};

// ==================== HELPERS ====================

/**
 * Détermine le statut du stock en fonction de la quantité et des seuils
 */
export function getStatutStock(
  quantite: number,
  seuilMin: number,
  seuilMax: number,
  stockSecurite?: number
): StatutStock {
  if (quantite === 0) return 'RUPTURE';

  const seuilCritique = stockSecurite || seuilMin * 0.5;

  if (quantite <= seuilCritique) return 'CRITIQUE';
  if (quantite <= seuilMin) return 'BAS';
  if (quantite >= seuilMax) return 'HAUT';

  return 'NORMAL';
}

/**
 * Calcule le pourcentage de stock par rapport au seuil max
 */
export function getStockPercentage(quantite: number, seuilMax: number): number {
  if (seuilMax === 0) return 0;
  return Math.min((quantite / seuilMax) * 100, 100);
}

/**
 * Détermine la couleur de la jauge de stock
 */
export function getStockGaugeColor(statut: StatutStock): string {
  switch (statut) {
    case 'RUPTURE':
    case 'CRITIQUE':
      return 'bg-red-500';
    case 'BAS':
      return 'bg-yellow-500';
    case 'NORMAL':
      return 'bg-green-500';
    case 'HAUT':
      return 'bg-blue-500';
    default:
      return 'bg-gray-300';
  }
}

// ==================== FILTRES ====================

export interface StockFilters {
  search?: string;
  statut?: StatutStock | 'ALERTE'; // ALERTE = RUPTURE + CRITIQUE + BAS
  formeGalenique?: string;
  page?: number;
  limit?: number;
}

export interface MouvementStockFilters {
  medicamentId?: string;
  type?: TypeMouvement;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ==================== RESPONSE TYPES ====================

export interface StocksResponse {
  data: Array<{
    medicamentId: string;
    medicament: {
      id: string;
      code: string;
      nomCommercial: string;
      dci: string;
      formeGalenique: string;
      dosage?: string;
    };
    quantiteActuelle: number;
    seuilMin: number;
    seuilMax: number;
    stockSecurite?: number;
    statut: StatutStock;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MouvementsStockResponse {
  data: MouvementStock[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StockAlertes {
  ruptures: Array<{
    medicamentId: string;
    nomCommercial: string;
    quantiteActuelle: number;
  }>;
  critiques: Array<{
    medicamentId: string;
    nomCommercial: string;
    quantiteActuelle: number;
    seuilMin: number;
  }>;
  bas: Array<{
    medicamentId: string;
    nomCommercial: string;
    quantiteActuelle: number;
    seuilMin: number;
  }>;
}
