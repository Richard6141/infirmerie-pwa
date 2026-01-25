import { api } from '../api';
import { db, setSyncMeta, getSyncMeta, type SyncQueueItem } from '../db/schema';
import type { Patient } from '@/types/patient';
import type { Consultation } from '@/types/consultation';
import type { Medicament } from '@/types/medicament';
import type { Vaccination } from '@/types/vaccination';
import type { RendezVous } from '@/types/rendez-vous';

interface SyncDownloadResponse {
  patients: Patient[];
  consultations: Consultation[];
  medicaments: Medicament[];
  vaccinations: Vaccination[];
  rendezVous: RendezVous[];
  timestamp: string;
}

// ==================== PUSH SYNC TYPES ====================

interface PushSyncConsultation {
  tempId: string;
  patientId: string;
  infirmierId: string;
  date: string;
  motif: string;
  constantesVitales: any;
  examenClinique: string;
  diagnostic: string;
  observations: string;
  prochainRDV?: string;
  clientCreatedAt: string;
  deviceId: string;
  syncVersion: number;
  prescriptions: any[];
}

interface PushSyncRequest {
  consultations: PushSyncConsultation[];
  deviceId: string;
}

// ==================== PUSH SYNC TYPES - PATIENTS ====================

interface PushSyncPatient {
  tempId: string;
  userId: string | null; // null pour patients offline (backend crée le compte user)
  email?: string; // Optionnel mais recommandé (sinon email auto-généré)
  nom?: string; // Optionnel mais recommandé
  prenom?: string; // Optionnel mais recommandé
  matricule: string;
  dateNaissance: string;
  sexe: string;
  telephone: string;
  directionService: string;
  groupeSanguin?: string;
  allergies?: string;
  antecedents?: any; // Object selon API docs
  clientCreatedAt: string;
  syncVersion: number;
}

interface PushSyncPatientsRequest {
  patients: PushSyncPatient[];
  deviceId: string;
}

// ==================== PUSH SYNC TYPES - VACCINATIONS ====================

interface PushSyncVaccination {
  tempId: string;
  patientId: string;
  infirmierId: string; // Requis par le backend
  typeVaccin: string;
  dateAdministration: string; // Pas 'date'
  numeroDose?: number; // Numéro de la dose (1, 2, 3, etc.)
  nombreDosesTotal?: number; // Nombre total de doses prévues
  numeroLot?: string;
  prochainRappel?: string;
  notes?: string;
  clientCreatedAt: string;
  syncVersion: number;
  // Note: deviceId est au niveau de la requête, pas dans chaque vaccination
}

interface PushSyncVaccinationsRequest {
  vaccinations: PushSyncVaccination[];
  deviceId: string;
}

// ==================== COMMON TYPES ====================

interface PushSyncResultItem {
  tempId: string;
  serverId?: string;
  status: string;
  message: string;
  serverData?: any;
}

export interface PushSyncResponse {
  success: PushSyncResultItem[];
  conflicts: PushSyncResultItem[];
  errors: PushSyncResultItem[];
  stats: {
    total: number;
    success: number;
    conflicts: number;
    errors: number;
  };
}

// ==================== PULL SYNC TYPES ====================

interface PullSyncResponse {
  serverTimestamp: string;
  consultations: Consultation[];
  vaccinations: Vaccination[];
  rendezVous: RendezVous[];
  deleted: {
    consultations: string[];
    vaccinations: string[];
    rendezVous: string[];
  };
  stats: {
    consultations: { updated: number; deleted: number };
    vaccinations: { updated: number; deleted: number };
    rendezVous: { updated: number; deleted: number };
  };
}

// ==================== CONFLICT RESOLUTION ====================

export interface SyncConflict {
  tempId: string;
  serverId?: string;
  localData: Consultation;
  serverData: any;
  message: string;
}

export class SyncService {
  private static instance: SyncService;
  private deviceId: string;
  private conflictsCache: SyncConflict[] = [];

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async downloadAllData(): Promise<void> {
    console.log('[SyncService] Starting data download...');

    try {
      await setSyncMeta('syncInProgress', true);

      const { data } = await api.get<SyncDownloadResponse>('/sync/download');

      console.log('[SyncService] Downloaded:', {
        patients: data.patients.length,
        consultations: data.consultations.length,
        medicaments: data.medicaments.length,
        vaccinations: data.vaccinations.length,
        rendezVous: data.rendezVous.length
      });

      await db.transaction('rw', [db.patients, db.consultations, db.medicaments, db.vaccinations, db.rendezVous], async () => {
        await db.patients.clear();
        await db.consultations.clear();
        await db.medicaments.clear();
        await db.vaccinations.clear();
        await db.rendezVous.clear();

        await db.patients.bulkAdd(data.patients.map(p => ({
          ...p,
          syncStatus: 'synced' as const,
          lastModified: new Date().toISOString()
        })));

        await db.consultations.bulkAdd(data.consultations.map(c => ({
          ...c,
          syncStatus: 'synced' as const,
          lastModified: new Date().toISOString()
        })));

        await db.medicaments.bulkAdd(data.medicaments.map(m => ({
          ...m,
          syncStatus: 'synced' as const,
          lastModified: new Date().toISOString()
        })));

        await db.vaccinations.bulkAdd(data.vaccinations.map(v => ({
          ...v,
          syncStatus: 'synced' as const,
          lastModified: new Date().toISOString()
        })));

        await db.rendezVous.bulkAdd(data.rendezVous.map(r => ({
          ...r,
          syncStatus: 'synced' as const,
          lastModified: new Date().toISOString()
        })));
      });

      await setSyncMeta('lastSyncDate', new Date().toISOString());
      await setSyncMeta('lastError', null);
      await setSyncMeta('pendingOperationsCount', 0);

      console.log('[SyncService] Download completed');
    } catch (error: any) {
      console.error('[SyncService] Error:', error);
      await setSyncMeta('lastError', error?.message || 'Erreur');
      throw error;
    } finally {
      await setSyncMeta('syncInProgress', false);
    }
  }

  async getLocalDataCount() {
    return {
      patients: await db.patients.count(),
      consultations: await db.consultations.count(),
      medicaments: await db.medicaments.count(),
      vaccinations: await db.vaccinations.count(),
      rendezVous: await db.rendezVous.count()
    };
  }

  async clearAllLocalData(): Promise<void> {
    console.log('[SyncService] Clearing local data...');

    await db.transaction('rw', [db.patients, db.consultations, db.medicaments, db.vaccinations, db.rendezVous, db.syncMeta, db.syncQueue], async () => {
      await db.patients.clear();
      await db.consultations.clear();
      await db.medicaments.clear();
      await db.vaccinations.clear();
      await db.rendezVous.clear();
      await db.syncMeta.clear();
      await db.syncQueue.clear();
    });

    console.log('[SyncService] Data cleared');
  }

  // ==================== DEVICE ID MANAGEMENT ====================

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem('deviceId', deviceId);
      console.log('[SyncService] Created new deviceId:', deviceId);
    }
    return deviceId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  // ==================== PUSH SYNC (Consultations Offline → Serveur) ====================

  /**
   * Push consultations CREATE via /sync/push
   * (Méthode legacy - utilisée par pushConsultations())
   */
  private async pushConsultationsCreate(): Promise<PushSyncResponse> {
    console.log('[SyncService] Starting push sync...');

    try {
      await setSyncMeta('syncInProgress', true);

      // 1. Récupérer toutes les consultations pending de la queue
      const pendingQueue = await db.syncQueue
        .where('entity').equals('consultation')
        .and(item => item.operation === 'create')
        .toArray();

      if (pendingQueue.length === 0) {
        console.log('[SyncService] No consultations to push');
        return {
          success: [],
          conflicts: [],
          errors: [],
          stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
        };
      }

      console.log(`[SyncService] Found ${pendingQueue.length} consultations to push`);

      // 2. Préparer les consultations pour l'API
      const consultations: PushSyncConsultation[] = [];
      for (const queueItem of pendingQueue) {
        const consultation = await db.consultations.get(queueItem.entityId);
        if (!consultation) continue;

        consultations.push({
          tempId: consultation.tempId || consultation.id,
          patientId: consultation.patientId,
          infirmierId: consultation.infirmierId,
          date: consultation.date,
          motif: consultation.motif,
          constantesVitales: consultation.constantesVitales || {},
          examenClinique: consultation.examenClinique || '',
          diagnostic: consultation.diagnostic || '',
          observations: consultation.observations || '',
          prochainRDV: consultation.prochainRDV,
          clientCreatedAt: consultation.createdAt,
          deviceId: this.deviceId,
          syncVersion: 1,
          prescriptions: consultation.prescriptions || []
        });
      }

      if (consultations.length === 0) {
        console.log('[SyncService] No valid consultations found');
        return {
          success: [],
          conflicts: [],
          errors: [],
          stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
        };
      }

      // 3. Envoyer au serveur
      const { data } = await api.post<PushSyncResponse>('/sync/push', {
        consultations,
        deviceId: this.deviceId
      } as PushSyncRequest);

      console.log('[SyncService] Push response:', data.stats);

      // 4. Traiter les succès: mapper tempId → serverId
      for (const success of data.success) {
        const consultation = await db.consultations
          .where('tempId').equals(success.tempId)
          .or('id').equals(success.tempId)
          .first();

        if (consultation && success.serverId) {
          // Mettre à jour avec le serverId
          await db.consultations.delete(consultation.id);
          await db.consultations.put({
            ...consultation,
            id: success.serverId,
            tempId: undefined,
            syncStatus: 'synced',
            lastModified: new Date().toISOString()
          });

          // Supprimer de la queue
          await db.syncQueue
            .where('entityId').equals(success.tempId)
            .delete();

          console.log(`[SyncService] Mapped ${success.tempId} → ${success.serverId}`);
        }
      }

      // 5. Traiter les erreurs
      for (const error of data.errors) {
        const queueItem = await db.syncQueue
          .where('entityId').equals(error.tempId)
          .first();

        if (queueItem && queueItem.id) {
          await db.syncQueue.update(queueItem.id, {
            attempts: queueItem.attempts + 1,
            error: error.message,
            lastAttempt: new Date().toISOString()
          });

          console.error(`[SyncService] Error for ${error.tempId}:`, error.message);
        }
      }

      // 6. Traiter les conflits
      this.conflictsCache = [];
      for (const conflict of data.conflicts) {
        const consultation = await db.consultations
          .where('tempId').equals(conflict.tempId)
          .or('id').equals(conflict.tempId)
          .first();

        if (consultation) {
          this.conflictsCache.push({
            tempId: conflict.tempId,
            serverId: conflict.serverId,
            localData: consultation as Consultation,
            serverData: conflict.serverData,
            message: conflict.message
          });

          console.warn(`[SyncService] Conflict for ${conflict.tempId}:`, conflict.message);
        }
      }

      // 7. MAJ metadata
      await setSyncMeta('lastSyncDate', new Date().toISOString());
      await setSyncMeta('pendingOperationsCount', await db.syncQueue.count());

      return data;

    } catch (error: any) {
      console.error('[SyncService] Push error:', error);
      await setSyncMeta('lastError', error?.message || 'Push sync failed');
      throw error;
    } finally {
      await setSyncMeta('syncInProgress', false);
    }
  }

  /**
   * Push ALL pending operations (CREATE, UPDATE, DELETE)
   * Méthode principale utilisée par fullSync()
   */
  async pushConsultations(): Promise<PushSyncResponse> {
    console.log('[SyncService] Starting comprehensive push sync (CREATE + UPDATE + DELETE)...');

    const aggregatedResponse: PushSyncResponse = {
      success: [],
      conflicts: [],
      errors: [],
      stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
    };

    try {
      // ÉTAPE 1: Traiter les DELETE en premier (important!)
      const deleteQueue = await db.syncQueue
        .where('entity').equals('consultation')
        .and(item => item.operation === 'delete')
        .toArray();

      console.log(`[SyncService] Found ${deleteQueue.length} DELETE operations`);

      for (const queueItem of deleteQueue) {
        try {
          await api.delete(`/consultations/${queueItem.entityId}`);

          aggregatedResponse.success.push({
            tempId: queueItem.entityId,
            status: 'deleted',
            message: 'Supprimée avec succès'
          });
          aggregatedResponse.stats.success++;

          // Supprimer de la queue et de IndexedDB
          if (queueItem.id) {
            await db.syncQueue.delete(queueItem.id);
          }
          await db.consultations.delete(queueItem.entityId);

          console.log(`[SyncService] Deleted consultation: ${queueItem.entityId}`);

        } catch (error: any) {
          aggregatedResponse.errors.push({
            tempId: queueItem.entityId,
            status: 'error',
            message: error?.response?.data?.message || error.message
          });
          aggregatedResponse.stats.errors++;

          // MAJ queue avec erreur
          if (queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              attempts: queueItem.attempts + 1,
              error: error.message,
              lastAttempt: new Date().toISOString()
            });
          }

          console.error(`[SyncService] Delete error for ${queueItem.entityId}:`, error.message);
        }
      }

      // ÉTAPE 2: Traiter les UPDATE
      const updateQueue = await db.syncQueue
        .where('entity').equals('consultation')
        .and(item => item.operation === 'update')
        .toArray();

      console.log(`[SyncService] Found ${updateQueue.length} UPDATE operations`);

      for (const queueItem of updateQueue) {
        try {
          const { data } = await api.patch(`/consultations/${queueItem.entityId}`, queueItem.data);

          aggregatedResponse.success.push({
            tempId: queueItem.entityId,
            serverId: data.id,
            status: 'updated',
            message: 'Mise à jour réussie'
          });
          aggregatedResponse.stats.success++;

          // MAJ dans IndexedDB avec syncStatus: 'synced'
          await db.consultations.update(queueItem.entityId, {
            syncStatus: 'synced',
            lastModified: new Date().toISOString(),
            ...data
          });

          // Supprimer de la queue
          if (queueItem.id) {
            await db.syncQueue.delete(queueItem.id);
          }

          console.log(`[SyncService] Updated consultation: ${queueItem.entityId}`);

        } catch (error: any) {
          aggregatedResponse.errors.push({
            tempId: queueItem.entityId,
            status: 'error',
            message: error?.response?.data?.message || error.message
          });
          aggregatedResponse.stats.errors++;

          // MAJ queue avec erreur
          if (queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              attempts: queueItem.attempts + 1,
              error: error.message,
              lastAttempt: new Date().toISOString()
            });
          }

          console.error(`[SyncService] Update error for ${queueItem.entityId}:`, error.message);
        }
      }

      // ÉTAPE 3: Traiter les CREATE via /sync/push
      const createResponse = await this.pushConsultationsCreate();

      // Merger les résultats
      aggregatedResponse.success.push(...createResponse.success);
      aggregatedResponse.conflicts.push(...createResponse.conflicts);
      aggregatedResponse.errors.push(...createResponse.errors);
      aggregatedResponse.stats.total =
        deleteQueue.length + updateQueue.length + createResponse.stats.total;
      aggregatedResponse.stats.success += createResponse.stats.success;
      aggregatedResponse.stats.conflicts += createResponse.stats.conflicts;
      aggregatedResponse.stats.errors += createResponse.stats.errors;

      // MAJ metadata
      await setSyncMeta('lastSyncDate', new Date().toISOString());
      await setSyncMeta('pendingOperationsCount', await db.syncQueue.count());

      console.log('[SyncService] Comprehensive push completed:', aggregatedResponse.stats);
      return aggregatedResponse;

    } catch (error: any) {
      console.error('[SyncService] Comprehensive push error:', error);
      await setSyncMeta('lastError', error?.message || 'Push failed');
      throw error;
    }
  }

  // ==================== PUSH SYNC - PATIENTS ====================

  /**
   * Push patients CREATE via /sync/push-patients
   * (Méthode privée utilisée par pushPatients())
   */
  private async pushPatientsCreate(): Promise<PushSyncResponse> {
    console.log('[SyncService] Starting push patients CREATE...');

    try {
      const pendingQueue = await db.syncQueue
        .where('entity').equals('patient')
        .and(item => item.operation === 'create')
        .toArray();

      if (pendingQueue.length === 0) {
        console.log('[SyncService] No patients to push');
        return {
          success: [],
          conflicts: [],
          errors: [],
          stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
        };
      }

      console.log(`[SyncService] Found ${pendingQueue.length} patients to push`);
      console.log('[SyncService] Pending patient IDs:', pendingQueue.map(q => q.entityId));

      // Préparer les patients pour l'API
      const patients: PushSyncPatient[] = [];
      for (const queueItem of pendingQueue) {
        const patient = await db.patients.get(queueItem.entityId);
        if (!patient) continue;

        // Format attendu par le backend (Option 1 recommandée: avec email, nom, prenom)
        patients.push({
          tempId: patient.tempId || patient.id,
          userId: null, // null = patient créé offline, backend créera le compte user
          email: patient.email, // Recommandé (sinon backend génère: matricule@infirmerie.local)
          nom: patient.nom, // Recommandé (sinon backend met: "À compléter")
          prenom: patient.prenom, // Recommandé (sinon backend met: "À compléter")
          matricule: patient.matricule,
          dateNaissance: patient.dateNaissance,
          sexe: patient.sexe,
          telephone: patient.telephone,
          directionService: patient.directionService || patient.direction,
          groupeSanguin: patient.groupeSanguin,
          allergies: patient.allergies,
          antecedents: patient.antecedents || {},
          clientCreatedAt: patient.createdAt,
          syncVersion: 1
        });
      }

      if (patients.length === 0) {
        console.log('[SyncService] No valid patients found');
        return {
          success: [],
          conflicts: [],
          errors: [],
          stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
        };
      }

      // Log des données envoyées pour debug
      console.log('[SyncService] Sending patients to server:', JSON.stringify({
        count: patients.length,
        deviceId: this.deviceId,
        patients: patients.map(p => ({
          tempId: p.tempId,
          nom: p.nom,
          prenom: p.prenom,
          email: p.email,
          matricule: p.matricule
        }))
      }, null, 2));

      // Envoyer au serveur
      const { data } = await api.post<PushSyncResponse>('/sync/push-patients', {
        patients,
        deviceId: this.deviceId
      } as PushSyncPatientsRequest);

      console.log('[SyncService] Push patients response:', data.stats);
      console.log('[SyncService] Success:', data.success);
      console.log('[SyncService] Errors:', data.errors);
      console.log('[SyncService] Conflicts:', data.conflicts);

      // Log des erreurs et conflits détaillés
      if (data.errors && data.errors.length > 0) {
        console.error('[SyncService] Push patients errors:', data.errors);
      }
      if (data.conflicts && data.conflicts.length > 0) {
        console.warn('[SyncService] Push patients conflicts:', data.conflicts);
      }

      // Traiter les succès: mapper tempId → serverId
      for (const success of data.success) {
        const patient = await db.patients
          .where('tempId').equals(success.tempId)
          .or('id').equals(success.tempId)
          .first();

        if (patient && success.serverId) {
          await db.patients.delete(patient.id);
          await db.patients.put({
            ...patient,
            id: success.serverId,
            syncStatus: 'synced',
            lastModified: new Date().toISOString()
          });

          // Résoudre les références dans consultations et vaccinations
          await this.resolvePatientReferences(success.tempId, success.serverId);
        }

        // Supprimer de la queue
        const queueItem = await db.syncQueue
          .where('entityId').equals(success.tempId)
          .and(item => item.entity === 'patient' && item.operation === 'create')
          .first();
        if (queueItem?.id) {
          await db.syncQueue.delete(queueItem.id);
        }

        console.log(`[SyncService] Patient synced: ${success.tempId} → ${success.serverId}`);
      }

      // Traiter les conflits
      for (const conflict of data.conflicts) {
        const patient = await db.patients
          .where('tempId').equals(conflict.tempId)
          .or('id').equals(conflict.tempId)
          .first();

        if (patient && conflict.serverId) {
          // Si le conflit est "Version serveur plus récente", accepter la version serveur
          if (conflict.message?.includes('Version serveur plus récente') ||
              conflict.message?.includes('server version is newer')) {

            console.warn(`[SyncService] Accepting server version for ${conflict.tempId} → ${conflict.serverId}`);

            // Supprimer la version locale temporaire
            await db.patients.delete(patient.id);

            // Ajouter la version serveur
            await db.patients.put({
              ...conflict.serverData,
              id: conflict.serverId,
              syncStatus: 'synced',
              lastModified: new Date().toISOString()
            });

            // Résoudre les références
            await this.resolvePatientReferences(conflict.tempId, conflict.serverId);

            // Supprimer de la queue
            const queueItem = await db.syncQueue
              .where('entityId').equals(conflict.tempId)
              .and(item => item.entity === 'patient' && item.operation === 'create')
              .first();
            if (queueItem?.id) {
              await db.syncQueue.delete(queueItem.id);
            }

            console.log(`[SyncService] Conflict resolved: ${conflict.tempId} → ${conflict.serverId}`);
          } else {
            // Autres types de conflits: garder en cache pour résolution manuelle
            this.conflictsCache.push({
              tempId: conflict.tempId,
              serverId: conflict.serverId,
              localData: patient as any,
              serverData: conflict.serverData,
              message: conflict.message
            });

            console.warn(`[SyncService] Patient conflict requires manual resolution for ${conflict.tempId}:`, conflict.message);
          }
        }
      }

      await setSyncMeta('lastSyncDate', new Date().toISOString());
      await setSyncMeta('pendingOperationsCount', await db.syncQueue.count());

      return data;

    } catch (error: any) {
      console.error('[SyncService] Push patients error:', error);
      throw error;
    }
  }

  /**
   * Push ALL pending patient operations (DELETE, UPDATE, CREATE)
   */
  async pushPatients(): Promise<PushSyncResponse> {
    console.log('[SyncService] Starting comprehensive push patients...');

    const aggregatedResponse: PushSyncResponse = {
      success: [],
      conflicts: [],
      errors: [],
      stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
    };

    try {
      // ÉTAPE 1: DELETE
      const deleteQueue = await db.syncQueue
        .where('entity').equals('patient')
        .and(item => item.operation === 'delete')
        .toArray();

      console.log(`[SyncService] Found ${deleteQueue.length} patient DELETE operations`);

      for (const queueItem of deleteQueue) {
        try {
          await api.delete(`/patients/${queueItem.entityId}`);

          aggregatedResponse.success.push({
            tempId: queueItem.entityId,
            status: 'deleted',
            message: 'Patient supprimé avec succès'
          });
          aggregatedResponse.stats.success++;

          if (queueItem.id) {
            await db.syncQueue.delete(queueItem.id);
          }
          await db.patients.delete(queueItem.entityId);

          console.log(`[SyncService] Deleted patient: ${queueItem.entityId}`);

        } catch (error: any) {
          aggregatedResponse.errors.push({
            tempId: queueItem.entityId,
            status: 'error',
            message: error?.response?.data?.message || error.message
          });
          aggregatedResponse.stats.errors++;

          if (queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              attempts: queueItem.attempts + 1,
              error: error.message,
              lastAttempt: new Date().toISOString()
            });
          }

          console.error(`[SyncService] Delete patient error for ${queueItem.entityId}:`, error.message);
        }
      }

      // ÉTAPE 2: UPDATE
      const updateQueue = await db.syncQueue
        .where('entity').equals('patient')
        .and(item => item.operation === 'update')
        .toArray();

      console.log(`[SyncService] Found ${updateQueue.length} patient UPDATE operations`);

      for (const queueItem of updateQueue) {
        try {
          const { data } = await api.patch(`/patients/${queueItem.entityId}`, queueItem.data);

          aggregatedResponse.success.push({
            tempId: queueItem.entityId,
            serverId: data.id,
            status: 'updated',
            message: 'Patient mis à jour avec succès'
          });
          aggregatedResponse.stats.success++;

          await db.patients.update(queueItem.entityId, {
            syncStatus: 'synced',
            lastModified: new Date().toISOString(),
            ...data
          });

          if (queueItem.id) {
            await db.syncQueue.delete(queueItem.id);
          }

          console.log(`[SyncService] Updated patient: ${queueItem.entityId}`);

        } catch (error: any) {
          aggregatedResponse.errors.push({
            tempId: queueItem.entityId,
            status: 'error',
            message: error?.response?.data?.message || error.message
          });
          aggregatedResponse.stats.errors++;

          if (queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              attempts: queueItem.attempts + 1,
              error: error.message,
              lastAttempt: new Date().toISOString()
            });
          }

          console.error(`[SyncService] Update patient error for ${queueItem.entityId}:`, error.message);
        }
      }

      // ÉTAPE 3: CREATE
      const createResponse = await this.pushPatientsCreate();

      aggregatedResponse.success.push(...createResponse.success);
      aggregatedResponse.conflicts.push(...createResponse.conflicts);
      aggregatedResponse.errors.push(...createResponse.errors);
      aggregatedResponse.stats.total =
        deleteQueue.length + updateQueue.length + createResponse.stats.total;
      aggregatedResponse.stats.success += createResponse.stats.success;
      aggregatedResponse.stats.conflicts += createResponse.stats.conflicts;
      aggregatedResponse.stats.errors += createResponse.stats.errors;

      console.log('[SyncService] Push patients completed:', aggregatedResponse.stats);
      return aggregatedResponse;

    } catch (error: any) {
      console.error('[SyncService] Push patients error:', error);
      throw error;
    }
  }

  // ==================== PUSH SYNC - VACCINATIONS ====================

  /**
   * Push vaccinations CREATE via /sync/push-vaccinations
   */
  private async pushVaccinationsCreate(): Promise<PushSyncResponse> {
    console.log('[SyncService] Starting push vaccinations CREATE...');

    try {
      const pendingQueue = await db.syncQueue
        .where('entity').equals('vaccination')
        .and(item => item.operation === 'create')
        .toArray();

      if (pendingQueue.length === 0) {
        console.log('[SyncService] No vaccinations to push');
        return {
          success: [],
          conflicts: [],
          errors: [],
          stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
        };
      }

      console.log(`[SyncService] Found ${pendingQueue.length} vaccinations to push`);

      // Préparer les vaccinations pour l'API
      // Récupérer l'ID de l'infirmier connecté
      const userStr = localStorage.getItem('infirmerie_user');
      let infirmierId = '';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          infirmierId = user.id || '';
        } catch (error) {
          console.error('[SyncService] Failed to parse user from localStorage:', error);
        }
      }

      if (!infirmierId) {
        console.error('[SyncService] No infirmierId found - cannot sync vaccinations');
        throw new Error('Utilisateur non connecté - impossible de synchroniser les vaccinations');
      }

      const vaccinations: PushSyncVaccination[] = [];
      for (const queueItem of pendingQueue) {
        const vaccination = await db.vaccinations.get(queueItem.entityId);
        if (!vaccination) continue;

        vaccinations.push({
          tempId: vaccination.tempId || vaccination.id,
          patientId: vaccination.patientId,
          infirmierId, // ID de l'infirmier connecté
          typeVaccin: vaccination.typeVaccin,
          dateAdministration: vaccination.dateAdministration || vaccination.date || new Date().toISOString(), // Backend attend 'dateAdministration'
          numeroDose: vaccination.numeroDose,
          nombreDosesTotal: vaccination.nombreDosesTotal,
          numeroLot: vaccination.numeroLot,
          prochainRappel: vaccination.prochainRappel,
          notes: vaccination.notes,
          clientCreatedAt: vaccination.createdAt,
          syncVersion: 1
          // deviceId n'est PAS envoyé ici - il est au niveau de la requête
        });
      }

      if (vaccinations.length === 0) {
        console.log('[SyncService] No valid vaccinations found');
        return {
          success: [],
          conflicts: [],
          errors: [],
          stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
        };
      }

      // Envoyer au serveur
      const { data } = await api.post<PushSyncResponse>('/sync/push-vaccinations', {
        vaccinations,
        deviceId: this.deviceId
      } as PushSyncVaccinationsRequest);

      console.log('[SyncService] Push vaccinations response:', data.stats);

      // Traiter les succès
      for (const success of data.success) {
        const vaccination = await db.vaccinations
          .where('tempId').equals(success.tempId)
          .or('id').equals(success.tempId)
          .first();

        if (vaccination && success.serverId) {
          await db.vaccinations.delete(vaccination.id);
          await db.vaccinations.put({
            ...vaccination,
            id: success.serverId,
            syncStatus: 'synced',
            lastModified: new Date().toISOString()
          });
        }

        const queueItem = await db.syncQueue
          .where('entityId').equals(success.tempId)
          .and(item => item.entity === 'vaccination' && item.operation === 'create')
          .first();
        if (queueItem?.id) {
          await db.syncQueue.delete(queueItem.id);
        }

        console.log(`[SyncService] Vaccination synced: ${success.tempId} → ${success.serverId}`);
      }

      // Traiter les conflits
      for (const conflict of data.conflicts) {
        const vaccination = await db.vaccinations
          .where('tempId').equals(conflict.tempId)
          .or('id').equals(conflict.tempId)
          .first();

        if (vaccination) {
          this.conflictsCache.push({
            tempId: conflict.tempId,
            serverId: conflict.serverId,
            localData: vaccination as any,
            serverData: conflict.serverData,
            message: conflict.message
          });

          console.warn(`[SyncService] Vaccination conflict for ${conflict.tempId}:`, conflict.message);
        }
      }

      await setSyncMeta('lastSyncDate', new Date().toISOString());
      await setSyncMeta('pendingOperationsCount', await db.syncQueue.count());

      return data;

    } catch (error: any) {
      console.error('[SyncService] Push vaccinations error:', error);
      throw error;
    }
  }

  /**
   * Push ALL pending vaccination operations (DELETE, UPDATE, CREATE)
   */
  async pushVaccinations(): Promise<PushSyncResponse> {
    console.log('[SyncService] Starting comprehensive push vaccinations...');

    const aggregatedResponse: PushSyncResponse = {
      success: [],
      conflicts: [],
      errors: [],
      stats: { total: 0, success: 0, conflicts: 0, errors: 0 }
    };

    try {
      // ÉTAPE 1: DELETE
      const deleteQueue = await db.syncQueue
        .where('entity').equals('vaccination')
        .and(item => item.operation === 'delete')
        .toArray();

      console.log(`[SyncService] Found ${deleteQueue.length} vaccination DELETE operations`);

      for (const queueItem of deleteQueue) {
        try {
          await api.delete(`/vaccinations/${queueItem.entityId}`);

          aggregatedResponse.success.push({
            tempId: queueItem.entityId,
            status: 'deleted',
            message: 'Vaccination supprimée avec succès'
          });
          aggregatedResponse.stats.success++;

          if (queueItem.id) {
            await db.syncQueue.delete(queueItem.id);
          }
          await db.vaccinations.delete(queueItem.entityId);

          console.log(`[SyncService] Deleted vaccination: ${queueItem.entityId}`);

        } catch (error: any) {
          aggregatedResponse.errors.push({
            tempId: queueItem.entityId,
            status: 'error',
            message: error?.response?.data?.message || error.message
          });
          aggregatedResponse.stats.errors++;

          if (queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              attempts: queueItem.attempts + 1,
              error: error.message,
              lastAttempt: new Date().toISOString()
            });
          }

          console.error(`[SyncService] Delete vaccination error for ${queueItem.entityId}:`, error.message);
        }
      }

      // ÉTAPE 2: UPDATE
      const updateQueue = await db.syncQueue
        .where('entity').equals('vaccination')
        .and(item => item.operation === 'update')
        .toArray();

      console.log(`[SyncService] Found ${updateQueue.length} vaccination UPDATE operations`);

      for (const queueItem of updateQueue) {
        try {
          const { data } = await api.patch(`/vaccinations/${queueItem.entityId}`, queueItem.data);

          aggregatedResponse.success.push({
            tempId: queueItem.entityId,
            serverId: data.id,
            status: 'updated',
            message: 'Vaccination mise à jour avec succès'
          });
          aggregatedResponse.stats.success++;

          await db.vaccinations.update(queueItem.entityId, {
            syncStatus: 'synced',
            lastModified: new Date().toISOString(),
            ...data
          });

          if (queueItem.id) {
            await db.syncQueue.delete(queueItem.id);
          }

          console.log(`[SyncService] Updated vaccination: ${queueItem.entityId}`);

        } catch (error: any) {
          aggregatedResponse.errors.push({
            tempId: queueItem.entityId,
            status: 'error',
            message: error?.response?.data?.message || error.message
          });
          aggregatedResponse.stats.errors++;

          if (queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              attempts: queueItem.attempts + 1,
              error: error.message,
              lastAttempt: new Date().toISOString()
            });
          }

          console.error(`[SyncService] Update vaccination error for ${queueItem.entityId}:`, error.message);
        }
      }

      // ÉTAPE 3: CREATE
      const createResponse = await this.pushVaccinationsCreate();

      aggregatedResponse.success.push(...createResponse.success);
      aggregatedResponse.conflicts.push(...createResponse.conflicts);
      aggregatedResponse.errors.push(...createResponse.errors);
      aggregatedResponse.stats.total =
        deleteQueue.length + updateQueue.length + createResponse.stats.total;
      aggregatedResponse.stats.success += createResponse.stats.success;
      aggregatedResponse.stats.conflicts += createResponse.stats.conflicts;
      aggregatedResponse.stats.errors += createResponse.stats.errors;

      console.log('[SyncService] Push vaccinations completed:', aggregatedResponse.stats);
      return aggregatedResponse;

    } catch (error: any) {
      console.error('[SyncService] Push vaccinations error:', error);
      throw error;
    }
  }

  /**
   * Résout les références de tempId patient dans consultations et vaccinations
   */
  private async resolvePatientReferences(tempPatientId: string, serverPatientId: string): Promise<void> {
    console.log(`[SyncService] Resolving patient references: ${tempPatientId} → ${serverPatientId}`);

    // Mettre à jour les consultations qui référencent ce patient
    const consultations = await db.consultations.where('patientId').equals(tempPatientId).toArray();
    for (const consultation of consultations) {
      await db.consultations.update(consultation.id, {
        patientId: serverPatientId
      });
      console.log(`[SyncService] Updated consultation ${consultation.id} with new patientId`);
    }

    // Mettre à jour les vaccinations qui référencent ce patient
    const vaccinations = await db.vaccinations.where('patientId').equals(tempPatientId).toArray();
    for (const vaccination of vaccinations) {
      await db.vaccinations.update(vaccination.id, {
        patientId: serverPatientId
      });
      console.log(`[SyncService] Updated vaccination ${vaccination.id} with new patientId`);
    }
  }

  // ==================== PULL SYNC (Serveur → Local Incrémental) ====================

  async pullChanges(): Promise<PullSyncResponse> {
    console.log('[SyncService] Starting pull sync...');

    try {
      await setSyncMeta('syncInProgress', true);

      // 1. Récupérer timestamp de dernière sync
      const lastSyncAt = await getSyncMeta('lastSyncDate');
      const since = lastSyncAt || new Date(0).toISOString();

      console.log(`[SyncService] Pulling changes since ${since}`);

      // 2. Appeler API
      const { data } = await api.get<PullSyncResponse>(`/sync/pull?since=${since}`);

      console.log('[SyncService] Pull response:', data.stats);

      // 3. Merger consultations (écrase si synced, ignore si pending local)
      if (data.consultations && data.consultations.length > 0) {
        for (const serverConsultation of data.consultations) {
          const local = await db.consultations.get(serverConsultation.id);

          // Ne pas écraser si modification locale en attente
          if (local?.syncStatus === 'pending') {
            console.log(`[SyncService] Skipping ${serverConsultation.id} - pending local changes`);
            continue;
          }

          await db.consultations.put({
            ...serverConsultation,
            syncStatus: 'synced',
            lastModified: new Date().toISOString()
          });
        }
        console.log(`[SyncService] Merged ${data.consultations.length} consultations`);
      }

      // 4. Merger vaccinations
      if (data.vaccinations && data.vaccinations.length > 0) {
        for (const vaccination of data.vaccinations) {
          await db.vaccinations.put({
            ...vaccination,
            syncStatus: 'synced',
            lastModified: new Date().toISOString()
          });
        }
        console.log(`[SyncService] Merged ${data.vaccinations.length} vaccinations`);
      }

      // 5. Merger rendez-vous
      if (data.rendezVous && data.rendezVous.length > 0) {
        for (const rdv of data.rendezVous) {
          await db.rendezVous.put({
            ...rdv,
            syncStatus: 'synced',
            lastModified: new Date().toISOString()
          });
        }
        console.log(`[SyncService] Merged ${data.rendezVous.length} rendez-vous`);
      }

      // 6. Supprimer entités deleted (si soft delete implémenté)
      if (data.deleted.consultations.length > 0) {
        await db.consultations.bulkDelete(data.deleted.consultations);
        console.log(`[SyncService] Deleted ${data.deleted.consultations.length} consultations`);
      }
      if (data.deleted.vaccinations.length > 0) {
        await db.vaccinations.bulkDelete(data.deleted.vaccinations);
        console.log(`[SyncService] Deleted ${data.deleted.vaccinations.length} vaccinations`);
      }
      if (data.deleted.rendezVous.length > 0) {
        await db.rendezVous.bulkDelete(data.deleted.rendezVous);
        console.log(`[SyncService] Deleted ${data.deleted.rendezVous.length} rendez-vous`);
      }

      // 7. MAJ metadata
      await setSyncMeta('lastSyncDate', data.serverTimestamp);
      await setSyncMeta('lastError', null);

      console.log('[SyncService] Pull sync completed');
      return data;

    } catch (error: any) {
      console.error('[SyncService] Pull error:', error);
      await setSyncMeta('lastError', error?.message || 'Pull sync failed');
      throw error;
    } finally {
      await setSyncMeta('syncInProgress', false);
    }
  }

  // ==================== FULL SYNC (Push + Pull) ====================

  async fullSync(): Promise<{
    pushPatients: PushSyncResponse;
    pushConsultations: PushSyncResponse;
    pushVaccinations: PushSyncResponse;
    pull: PullSyncResponse
  }> {
    console.log('[SyncService] Starting full sync (multi-entity)...');

    // ORDRE CRITIQUE: Patients → Consultations → Vaccinations
    // Car consultations et vaccinations dépendent des patients

    // 1. Push Patients en premier (résout tempId → serverId)
    const pushPatients = await this.pushPatients();
    console.log('[SyncService] Patients push:', pushPatients.stats);

    // 2. Push Consultations (peut maintenant référencer patients synced)
    const pushConsultations = await this.pushConsultations();
    console.log('[SyncService] Consultations push:', pushConsultations.stats);

    // 3. Push Vaccinations (peut maintenant référencer patients synced)
    const pushVaccinations = await this.pushVaccinations();
    console.log('[SyncService] Vaccinations push:', pushVaccinations.stats);

    // 4. Pull changes from server
    const pull = await this.pullChanges();
    console.log('[SyncService] Pull sync:', pull.stats);

    console.log('[SyncService] Full sync completed');
    return { pushPatients, pushConsultations, pushVaccinations, pull };
  }

  // ==================== CONFLICT MANAGEMENT ====================

  getConflicts(): SyncConflict[] {
    return this.conflictsCache;
  }

  async resolveConflict(tempId: string, resolution: 'client' | 'server'): Promise<void> {
    const conflict = this.conflictsCache.find(c => c.tempId === tempId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${tempId}`);
    }

    if (resolution === 'server') {
      // Accepter version serveur
      if (conflict.serverId && conflict.serverData) {
        await db.consultations.delete(conflict.localData.id);
        await db.consultations.put({
          ...conflict.serverData,
          syncStatus: 'synced',
          lastModified: new Date().toISOString()
        });

        // Supprimer de la queue
        await db.syncQueue.where('entityId').equals(tempId).delete();
      }
    } else {
      // Garder version client - renvoyer au push
      // (Ne rien faire, le prochain push réessaiera)
      console.log(`[SyncService] Keeping client version for ${tempId}`);
    }

    // Retirer du cache
    this.conflictsCache = this.conflictsCache.filter(c => c.tempId !== tempId);
  }

  async clearConflicts(): Promise<void> {
    this.conflictsCache = [];
  }

  // ==================== DIAGNOSTIC METHODS ====================

  /**
   * Obtenir des informations détaillées sur l'état de la synchronisation
   * Utile pour le débogage
   */
  async getDiagnosticInfo(): Promise<{
    deviceId: string;
    lastSyncDate: string | null;
    syncInProgress: boolean;
    pendingOperationsCount: number;
    lastError: string | null;
    queueDetails: {
      patients: { create: number; update: number; delete: number };
      consultations: { create: number; update: number; delete: number };
      vaccinations: { create: number; update: number; delete: number };
    };
    queueItems: SyncQueueItem[];
  }> {
    const queueItems = await db.syncQueue.toArray();

    // Compter par entité et opération
    const queueDetails = {
      patients: { create: 0, update: 0, delete: 0 },
      consultations: { create: 0, update: 0, delete: 0 },
      vaccinations: { create: 0, update: 0, delete: 0 }
    };

    for (const item of queueItems) {
      if (item.entity === 'patient') {
        queueDetails.patients[item.operation]++;
      } else if (item.entity === 'consultation') {
        queueDetails.consultations[item.operation]++;
      } else if (item.entity === 'vaccination') {
        queueDetails.vaccinations[item.operation]++;
      }
    }

    return {
      deviceId: this.deviceId,
      lastSyncDate: await getSyncMeta('lastSyncDate'),
      syncInProgress: await getSyncMeta('syncInProgress'),
      pendingOperationsCount: queueItems.length,
      lastError: await getSyncMeta('lastError'),
      queueDetails,
      queueItems
    };
  }

  /**
   * Afficher les informations de diagnostic dans la console
   * Peut être appelé depuis la console du navigateur: window.syncDiagnostic()
   */
  async logDiagnostic(): Promise<void> {
    const info = await this.getDiagnosticInfo();

    console.group('📊 SYNC DIAGNOSTIC INFO');
    console.log('🔑 Device ID:', info.deviceId);
    console.log('📅 Last Sync:', info.lastSyncDate || 'Never');
    console.log('🔄 Sync In Progress:', info.syncInProgress);
    console.log('📦 Pending Operations:', info.pendingOperationsCount);
    console.log('❌ Last Error:', info.lastError || 'None');

    console.group('📋 Queue Details');
    console.log('👤 Patients:', info.queueDetails.patients);
    console.log('📝 Consultations:', info.queueDetails.consultations);
    console.log('💉 Vaccinations:', info.queueDetails.vaccinations);
    console.groupEnd();

    if (info.queueItems.length > 0) {
      console.group('🗂️ Queue Items');
      console.table(info.queueItems.map(item => ({
        Entity: item.entity,
        Operation: item.operation,
        EntityID: item.entityId,
        Attempts: item.attempts,
        CreatedAt: new Date(item.createdAt).toLocaleString(),
        LastAttempt: item.lastAttempt ? new Date(item.lastAttempt).toLocaleString() : 'N/A',
        Error: item.error || 'None'
      })));
      console.groupEnd();
    }

    console.groupEnd();

    return;
  }

  /**
   * Exposer la fonction de diagnostic globalement pour accès depuis la console
   */
  exposeGlobalDiagnostic(): void {
    if (typeof window !== 'undefined') {
      (window as any).syncDiagnostic = () => this.logDiagnostic();
      console.log('💡 Sync diagnostic available: Run syncDiagnostic() in console');
    }
  }
}

export const syncService = SyncService.getInstance();

// Exposer le diagnostic globalement en développement
if (import.meta.env.DEV) {
  syncService.exposeGlobalDiagnostic();
}
