// ==================== DASHBOARD GÉNÉRAL ====================

export interface DashboardStats {
  totalPatients: number;
  consultationsMoisEnCours: number;
  vaccinationsMoisEnCours: number;
  rendezVousAVenir: number;
  consultationsParJour: ConsultationParJour[];
  topMotifsConsultations: MotifCount[];
  repartitionPatientsParDirection: DirectionCount[];
}

export interface ConsultationParJour {
  date: string;
  count: number;
}

export interface MotifCount {
  motif: string;
  count: number;
}

export interface DirectionCount {
  direction: string;
  count: number;
}

// ==================== RAPPORT CONSULTATIONS ====================

export interface RapportConsultations {
  periode: {
    debut: string;
    fin: string;
  };
  totalConsultations: number;
  consultationsParStatut: {
    terminees: number;
    enCours: number;
    annulees: number;
  };
  consultationsParJour: ConsultationParJour[];
  topMotifs: MotifCount[];
  topInfirmiers?: InfirmierCount[];
  moyenneDuree?: number; // en minutes
}

export interface InfirmierCount {
  nom: string;
  count: number;
}

export interface RapportConsultationsFilters {
  startDate?: string;
  endDate?: string;
  infirmierId?: string;
}

// ==================== RAPPORT STOCKS ====================

export interface RapportStocks {
  periode: {
    debut: string;
    fin: string;
  };
  alertesRuptures: MedicamentRupture[];
  mouvementsPeriode: {
    entrees: number;
    sorties: number;
    total: number;
  };
  medicamentsPlusConsommes: MedicamentConsommation[];
  valeurStockTotal?: number;
}

export interface MedicamentRupture {
  id: string;
  code: string;
  nomCommercial: string;
  dci: string;
  quantiteActuelle: number;
  seuilMin: number;
  seuilMax: number;
}

export interface MedicamentConsommation {
  id: string;
  nomCommercial: string;
  quantiteConsommee: number;
  dernierMouvement?: string;
}

export interface RapportStocksFilters {
  startDate?: string;
  endDate?: string;
}

// ==================== RAPPORT VACCINATIONS ====================

export interface RapportVaccinations {
  periode: {
    debut: string;
    fin: string;
  };
  totalVaccinations: number;
  statistiquesParType: VaccinationType[];
  couvertureVaccinale: {
    eligible: number;
    vaccines: number;
    pourcentage: number;
  };
  rappelsAVenir: RappelVaccin[];
}

export interface VaccinationType {
  typeVaccin: string;
  count: number;
  pourcentage: number;
}

export interface RappelVaccin {
  patientId: string;
  nomPatient: string;
  typeVaccin: string;
  dateRappel: string;
  statut: 'URGENT' | 'PROCHE' | 'PLANIFIE';
}

export interface RapportVaccinationsFilters {
  startDate?: string;
  endDate?: string;
  typeVaccin?: string;
}

// ==================== OPTIONS D'EXPORT ====================

export interface ExportOptions {
  format: 'PDF' | 'CSV' | 'EXCEL';
  includeCharts?: boolean;
  orientation?: 'portrait' | 'landscape';
}
