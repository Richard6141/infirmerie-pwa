import Dexie, { type EntityTable } from 'dexie';
import type { Patient } from '@/types/patient';
import type { Consultation } from '@/types/consultation';
import type { Medicament } from '@/types/medicament';
import type { Vaccination } from '@/types/vaccination';
import type { RendezVous } from '@/types/rendez-vous';

// ==================== SYNC STATUS ====================
export type SyncStatus = 'synced' | 'pending' | 'error';

export interface SyncableItem {
  syncStatus: SyncStatus;
  tempId?: string; // ID temporaire pour les créations offline
  lastModified: string; // ISO date string
  syncError?: string; // Message d'erreur si sync a échoué
  isDeleted?: boolean; // Soft delete flag
  deletedAt?: string; // Date de suppression (ISO string)
}

// ==================== EXTENDED TYPES WITH SYNC ====================

export interface PatientLocal extends Patient, SyncableItem {}
export interface ConsultationLocal extends Consultation, SyncableItem {}
export interface MedicamentLocal extends Medicament, SyncableItem {}
export interface VaccinationLocal extends Vaccination, SyncableItem {}
export interface RendezVousLocal extends RendezVous, SyncableItem {}

// ==================== SYNC METADATA ====================

export interface SyncMeta {
  key: string;
  value: any;
  updatedAt: string;
}

// Keys utilisées pour syncMeta:
// - lastSyncDate: Date de la dernière synchronisation réussie
// - syncInProgress: Boolean indiquant si une sync est en cours
// - pendingOperationsCount: Nombre d'opérations en attente
// - lastError: Dernière erreur de synchronisation

// ==================== SYNC QUEUE ====================

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncEntity = 'patient' | 'consultation' | 'medicament' | 'vaccination' | 'rendez-vous';

export interface SyncQueueItem {
  id?: number; // Auto-incremented ID
  entity: SyncEntity;
  operation: SyncOperation;
  entityId: string; // ID de l'entité (tempId pour create)
  data?: any; // Données à envoyer (pour create/update)
  createdAt: string; // Timestamp de création dans la queue
  attempts: number; // Nombre de tentatives de sync
  lastAttempt?: string; // Timestamp de la dernière tentative
  error?: string; // Message d'erreur si échec
}

// ==================== DEXIE DATABASE ====================

export class InfirmerieDB extends Dexie {
  // Tables principales
  patients!: EntityTable<PatientLocal, 'id'>;
  consultations!: EntityTable<ConsultationLocal, 'id'>;
  medicaments!: EntityTable<MedicamentLocal, 'id'>;
  vaccinations!: EntityTable<VaccinationLocal, 'id'>;
  rendezVous!: EntityTable<RendezVousLocal, 'id'>;

  // Tables de synchronisation
  syncMeta!: EntityTable<SyncMeta, 'key'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('infirmerie');

    this.version(1).stores({
      // Tables principales avec indexes pour recherche rapide
      patients: 'id, matricule, nom, prenom, direction, syncStatus, lastModified',
      consultations: 'id, patientId, infirmierId, date, statut, syncStatus, lastModified, tempId',
      medicaments: 'id, code, nomCommercial, dci, categorie, syncStatus, lastModified',
      vaccinations: 'id, patientId, typeVaccin, date, syncStatus, lastModified, tempId',
      rendezVous: 'id, patientId, infirmierId, date, statut, syncStatus, lastModified, tempId',

      // Tables de synchronisation
      syncMeta: 'key, updatedAt',
      syncQueue: '++id, entity, operation, entityId, createdAt, attempts'
    });

    // Version 2: Ajouter tempId index pour patients
    this.version(2).stores({
      patients: 'id, matricule, nom, prenom, direction, syncStatus, lastModified, tempId',
      consultations: 'id, patientId, infirmierId, date, statut, syncStatus, lastModified, tempId',
      medicaments: 'id, code, nomCommercial, dci, categorie, syncStatus, lastModified',
      vaccinations: 'id, patientId, typeVaccin, date, syncStatus, lastModified, tempId',
      rendezVous: 'id, patientId, infirmierId, date, statut, syncStatus, lastModified, tempId',
      syncMeta: 'key, updatedAt',
      syncQueue: '++id, entity, operation, entityId, createdAt, attempts'
    });

    // Version 3: Ajouter soft delete (isDeleted, deletedAt)
    this.version(3).stores({
      patients: 'id, matricule, nom, prenom, direction, syncStatus, lastModified, tempId, isDeleted',
      consultations: 'id, patientId, infirmierId, date, statut, syncStatus, lastModified, tempId, isDeleted',
      medicaments: 'id, code, nomCommercial, dci, categorie, syncStatus, lastModified, isDeleted',
      vaccinations: 'id, patientId, typeVaccin, date, syncStatus, lastModified, tempId, isDeleted',
      rendezVous: 'id, patientId, infirmierId, date, statut, syncStatus, lastModified, tempId, isDeleted',
      syncMeta: 'key, updatedAt',
      syncQueue: '++id, entity, operation, entityId, createdAt, attempts'
    });
  }
}

// ==================== SINGLETON INSTANCE ====================

export const db = new InfirmerieDB();

// ==================== HELPER FUNCTIONS ====================

/**
 * Génère un ID temporaire pour les entités créées offline
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vérifie si un ID est temporaire
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_');
}

/**
 * Récupère une valeur de syncMeta
 */
export async function getSyncMeta(key: string): Promise<any> {
  const meta = await db.syncMeta.get(key);
  return meta?.value;
}

/**
 * Définit une valeur de syncMeta
 */
export async function setSyncMeta(key: string, value: any): Promise<void> {
  await db.syncMeta.put({
    key,
    value,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Ajoute une opération à la file de synchronisation
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts'>): Promise<number> {
  return await db.syncQueue.add({
    ...item,
    createdAt: new Date().toISOString(),
    attempts: 0
  });
}

/**
 * Récupère toutes les opérations en attente de synchronisation
 */
export async function getPendingSyncOperations(): Promise<SyncQueueItem[]> {
  return await db.syncQueue.orderBy('createdAt').toArray();
}

/**
 * Supprime une opération de la file de synchronisation
 */
export async function removeSyncOperation(id: number): Promise<void> {
  await db.syncQueue.delete(id);
}

/**
 * Marque une tentative de synchronisation comme échouée
 */
export async function markSyncAttemptFailed(id: number, error: string): Promise<void> {
  const item = await db.syncQueue.get(id);
  if (item) {
    await db.syncQueue.update(id, {
      attempts: item.attempts + 1,
      lastAttempt: new Date().toISOString(),
      error
    });
  }
}

/**
 * Nettoie les anciennes opérations de synchronisation (échecs > 3 jours)
 */
export async function cleanupOldSyncOperations(): Promise<number> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const oldItems = await db.syncQueue
    .filter(item => item.attempts > 10 || (item.lastAttempt && new Date(item.lastAttempt) < threeDaysAgo))
    .toArray();

  for (const item of oldItems) {
    if (item.id) {
      await db.syncQueue.delete(item.id);
    }
  }

  return oldItems.length;
}
