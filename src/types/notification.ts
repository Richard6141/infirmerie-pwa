export type NotificationType = 'NOUVEAU_RDV' | 'RDV_ANNULE' | 'RDV_MODIFIE' | 'RAPPEL';

export interface NotificationInApp {
  id: string;
  type: NotificationType;
  titre: string;
  message: string;
  metadata?: {
    rendezVousId?: string;
    patientId?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
