import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { db } from '../db/schema';
import { useOnlineStatus } from './useOnlineStatus';
import type {
  Patient,
  PatientFilters,
  PatientsResponse,
  CreatePatientDTO,
  UpdatePatientDTO,
} from '@/types/patient';
import type { PatientLocal } from '../db/schema';

// Query keys
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: PatientFilters) => [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

// ==================== GET PATIENTS (Liste avec filtres) ====================
export function usePatients(filters: PatientFilters = {}) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: patientKeys.list(filters),
    queryFn: async (): Promise<PatientsResponse> => {
      // MODE OFFLINE: Lire depuis IndexedDB
      if (!isOnline) {
        let patients = await db.patients
          .filter(p => !p.isDeleted) // Exclure les patients supprimés
          .toArray();

        // Appliquer les filtres
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          patients = patients.filter(p =>
            p.nom?.toLowerCase().includes(searchLower) ||
            p.prenom?.toLowerCase().includes(searchLower) ||
            p.matricule?.toLowerCase().includes(searchLower)
          );
        }
        if (filters.sexe) {
          patients = patients.filter(p => p.sexe === filters.sexe);
        }
        if (filters.groupeSanguin) {
          patients = patients.filter(p => p.groupeSanguin === filters.groupeSanguin);
        }
        if (filters.direction) {
          patients = patients.filter(p =>
            p.direction === filters.direction ||
            p.directionService === filters.direction
          );
        }

        // Pagination côté client
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = patients.slice(startIndex, endIndex);

        return {
          data: paginatedData as unknown as Patient[],
          page,
          total: patients.length,
          totalPages: Math.ceil(patients.length / limit),
        };
      }

      // MODE ONLINE: API normale
      const params = new URLSearchParams();
      const hasSearch = filters.search || filters.sexe || filters.groupeSanguin || filters.direction;

      if (hasSearch) {
        if (filters.search) params.append('nom', filters.search);
        if (filters.sexe) params.append('sexe', filters.sexe);
        if (filters.groupeSanguin) params.append('groupeSanguin', filters.groupeSanguin);
        if (filters.direction) params.append('directionService', filters.direction);

        const url = `/patients/search?${params.toString()}`;
        const { data } = await api.get<Patient[]>(url);

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = data.slice(startIndex, endIndex);

        return {
          data: paginatedData,
          page,
          total: data.length,
          totalPages: Math.ceil(data.length / limit),
        };
      } else {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const url = `/patients?${params.toString()}`;
        const { data } = await api.get<PatientsResponse>(url);
        return data;
      }
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== GET PATIENT (Détail par ID) ====================
export function usePatient(id: string | undefined) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: patientKeys.detail(id!),
    queryFn: async (): Promise<Patient> => {
      if (!id) throw new Error('Patient ID manquant');

      // MODE OFFLINE: Lire depuis IndexedDB
      if (!isOnline) {
        const patient = await db.patients.get(id);
        if (!patient) throw new Error('Patient introuvable');
        return patient as unknown as Patient;
      }

      // MODE ONLINE: API normale
      const { data } = await api.get<Patient>(`/patients/${id}`);
      return data;
    },
    enabled: !!id, // Ne lance la requête que si l'ID existe
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== CREATE PATIENT (Offline-capable) ====================
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async (patientData: CreatePatientDTO): Promise<Patient> => {
      // Vérifier le statut online EN TEMPS RÉEL (pas via le hook qui peut être stale)
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        const { data } = await api.post<Patient>('/patients', patientData);
        return data;
      } else {
        // MODE OFFLINE: IndexedDB + Queue
        try {
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
          const now = new Date().toISOString();

          // Générer un matricule temporaire si non fourni
          const matricule = patientData.matricule || `TEMP-${Date.now()}`;

          const patient: PatientLocal = {
            id: tempId,
            tempId,
            ...patientData,
            matricule, // S'assurer que matricule existe
            direction: patientData.direction || patientData.directionService || '',
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            lastModified: now,
          };

          // Sauvegarder dans IndexedDB
          await db.patients.add(patient);

          // Ajouter à la queue de sync
          await db.syncQueue.add({
            entity: 'patient',
            operation: 'create',
            entityId: tempId,
            data: patient,
            createdAt: now,
            attempts: 0
          });

          // Retourner comme Patient pour compatibilité
          return patient as unknown as Patient;
        } catch (error) {
          console.error('[useCreatePatient] Error creating offline patient:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      // Invalider toutes les listes de patients pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
    onError: (error: any) => {
      console.error('[useCreatePatient] Mutation error:', error);
    },
  });
}

// ==================== UPDATE PATIENT (Offline-capable) ====================
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async ({
      id,
      data: patientData,
    }: {
      id: string;
      data: UpdatePatientDTO;
    }): Promise<Patient> => {
      // Vérifier le statut online EN TEMPS RÉEL
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        const { data } = await api.patch<Patient>(`/patients/${id}`, patientData);
        return data;
      } else {
        // MODE OFFLINE: Mettre à jour dans IndexedDB
        const now = new Date().toISOString();

        // Récupérer le patient existant
        const existing = await db.patients.get(id);
        if (!existing) {
          throw new Error('Patient introuvable');
        }

        // Vérifier si c'est un patient créé offline (tempId existe)
        const isOfflineCreated = !!existing.tempId;

        if (isOfflineCreated) {
          // CAS 1: Patient créé offline (tempId existe)
          // → MAJ directe dans IndexedDB + MAJ dans queue

          const updated: PatientLocal = {
            ...existing,
            ...patientData,
            updatedAt: now,
            lastModified: now,
            // syncStatus reste 'pending'
          };

          await db.patients.put(updated);

          // Mettre à jour dans la queue si elle existe
          const queueItem = await db.syncQueue
            .where('entityId').equals(id)
            .first();

          if (queueItem && queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              data: updated
            });
          }

          return updated as unknown as Patient;

        } else {
          // CAS 2: Patient déjà synced
          // → Marquer comme modifié + ajouter UPDATE à la queue

          const updated: PatientLocal = {
            ...existing,
            ...patientData,
            updatedAt: now,
            lastModified: now,
            syncStatus: 'pending', // Marquer comme non synced
          };

          await db.patients.put(updated);

          // Ajouter opération UPDATE à la queue
          await db.syncQueue.add({
            entity: 'patient',
            operation: 'update',
            entityId: id,
            data: patientData, // Seulement les champs modifiés
            createdAt: now,
            attempts: 0
          });

          return updated as unknown as Patient;
        }
      }
    },
    onSuccess: (updatedPatient) => {
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      // Invalider le détail du patient modifié
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(updatedPatient.id) });
    },
  });
}

// ==================== DELETE PATIENT (Offline-capable) ====================
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async (id: string): Promise<void> => {
      // Vérifier le statut online EN TEMPS RÉEL
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        await api.delete(`/patients/${id}`);
      } else {
        // MODE OFFLINE: Soft delete local
        const now = new Date().toISOString();

        // Récupérer le patient
        const existing = await db.patients.get(id);
        if (!existing) {
          throw new Error('Patient introuvable');
        }

        // Vérifier si c'est un patient créé offline (tempId existe)
        const isOfflineCreated = !!existing.tempId;

        if (isOfflineCreated) {
          // CAS 1: Patient jamais synced (tempId existe)
          // → Supprimer complètement de IndexedDB + queue

          await db.patients.delete(id);

          // Supprimer de la queue
          await db.syncQueue
            .where('entityId').equals(id)
            .delete();

        } else {
          // CAS 2: Patient déjà synced
          // → Soft delete (marquer comme deleted) + ajouter DELETE à la queue

          const deleted: PatientLocal = {
            ...existing,
            isDeleted: true,           // Marquer comme supprimé
            deletedAt: now,            // Date de suppression
            syncStatus: 'pending',     // À synchroniser
            lastModified: now,
            updatedAt: now
          };

          await db.patients.put(deleted);

          // Ajouter opération DELETE à la queue
          await db.syncQueue.add({
            entity: 'patient',
            operation: 'delete',
            entityId: id,
            data: null,
            createdAt: now,
            attempts: 0
          });
        }
      }
    },
    onSuccess: () => {
      // Invalider toutes les listes de patients
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}

// ==================== GET PATIENT DIRECTIONS (Pour filtres) ====================
export function usePatientDirections() {
  return useQuery({
    queryKey: ['patients', 'directions'],
    queryFn: async (): Promise<string[]> => {
      const { data } = await api.get<string[]>('/patients/directions');
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (les directions changent rarement)
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
// FORCE RELOAD 1766850082
