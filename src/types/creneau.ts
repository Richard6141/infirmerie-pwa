export interface CreneauDisponible {
  heureDebut: string;
  heureFin: string;
  disponible: boolean;
  raison?: string;
}

export interface CreneauxDisponiblesResponse {
  date: string;
  isJourOuvre: boolean;
  raisonNonOuvre?: string;
  creneaux: CreneauDisponible[];
}

export interface CreneauBloque {
  id: string;
  dateDebut: string;
  dateFin: string;
  motif?: string;
  isRecurrent: boolean;
  jourSemaine?: number;
  jourSemaineLibelle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreneauBloqueData {
  dateDebut: string;
  dateFin: string;
  motif?: string;
  isRecurrent?: boolean;
  jourSemaine?: number;
}
