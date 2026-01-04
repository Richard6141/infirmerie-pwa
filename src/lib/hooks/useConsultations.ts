import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { db } from '../db/schema';
import { useOnlineStatus } from './useOnlineStatus';
import { useAuth } from './useAuth';
import type {
  Consultation,
  ConsultationFilters,
  ConsultationsResponse,
  CreateConsultationData,
} from '@/types/consultation';
import type { ConsultationLocal } from '../db/schema';

// Query keys
export const consultationKeys = {
  all: ['consultations'] as const,
  lists: () => [...consultationKeys.all, 'list'] as const,
  list: (filters: ConsultationFilters) => [...consultationKeys.lists(), filters] as const,
  details: () => [...consultationKeys.all, 'detail'] as const,
  detail: (id: string) => [...consultationKeys.details(), id] as const,
  byPatient: (patientId: string) => [...consultationKeys.all, 'patient', patientId] as const,
  me: () => [...consultationKeys.all, 'me'] as const,
};

// ==================== GET CONSULTATIONS (Liste avec filtres) ====================
export function useConsultations(filters: ConsultationFilters = {}) {
  const isOnline = useOnlineStatus();

  // Nettoyer les filtres (enlever undefined)
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as ConsultationFilters;

  return useQuery({
    queryKey: consultationKeys.list(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<ConsultationsResponse> => {
      const params = new URLSearchParams();

      if (cleanFilters.patientId) params.append('patientId', cleanFilters.patientId);
      if (cleanFilters.search) params.append('search', cleanFilters.search);
      if (cleanFilters.startDate) params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);
      if (cleanFilters.page) params.append('page', cleanFilters.page.toString());
      if (cleanFilters.limit) params.append('limit', cleanFilters.limit.toString());

      const { data } = await api.get<ConsultationsResponse>(`/consultations?${params.toString()}`);
      return data;
    },
    staleTime: 0, // Toujours refetch pour que les filtres fonctionnent
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== GET CONSULTATION (Détail par ID) ====================
export function useConsultation(id: string | undefined) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: consultationKeys.detail(id!),
    queryFn: async (): Promise<Consultation> => {
      const { data } = await api.get<Consultation>(`/consultations/${id}`);
      return data;
    },
    enabled: !!id && isOnline, // Ne fait la requête que si ID existe ET online
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== GET MY CONSULTATIONS (Patient connecté) ====================
export function useMyConsultations() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: consultationKeys.me(),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<Consultation[]> => {
      const { data } = await api.get<Consultation[]>('/consultations/me');
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (patient profile not found)
      if (error?.response?.status === 404) return false;
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}

// ==================== GET CONSULTATIONS BY PATIENT (Infirmier) ====================
export function useConsultationsByPatient(patientId: string | undefined) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: consultationKeys.byPatient(patientId!),
    queryFn: async (): Promise<Consultation[]> => {
      const { data } = await api.get<Consultation[]>(`/consultations/patient/${patientId}`);
      return data;
    },
    enabled: !!patientId && isOnline, // Ne fait la requête que si patientId existe ET online
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== CREATE CONSULTATION (Offline-capable) ====================
export function useCreateConsultation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async (consultationData: CreateConsultationData): Promise<Consultation> => {
      // Vérifier le statut online EN TEMPS RÉEL
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        const { data } = await api.post<Consultation>('/consultations', consultationData);
        return data;
      } else {
        // MODE OFFLINE: IndexedDB + Queue
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        const now = new Date().toISOString();

        // Récupérer les informations du patient pour les champs nom/matricule
        const patient = await db.patients.get(consultationData.patientId);
        const nomPatient = patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu';
        const matriculePatient = patient?.matricule || '';
        const nomInfirmier = user ? `${user.prenom} ${user.nom}` : 'Infirmier';

        const consultation: ConsultationLocal = {
          id: tempId,
          tempId,
          patientId: consultationData.patientId,
          nomPatient,
          matriculePatient,
          infirmierId: user?.id || '',
          nomInfirmier,
          date: now, // Date auto-générée pour offline
          motif: consultationData.motif,
          constantesVitales: consultationData.constantesVitales || {},
          examenClinique: consultationData.examenClinique || '',
          diagnostic: consultationData.diagnostic || '',
          observations: consultationData.observations || '',
          prochainRDV: consultationData.prochainRDV,
          prescriptions: (consultationData.prescriptions || []) as any, // Type cast temporaire
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending',
          lastModified: now,
        };

        // Sauvegarder dans IndexedDB
        await db.consultations.add(consultation);

        // Ajouter à la queue de sync
        await db.syncQueue.add({
          entity: 'consultation',
          operation: 'create',
          entityId: tempId,
          data: consultation,
          createdAt: now,
          attempts: 0
        });

        // Retourner comme Consultation pour compatibilité
        return consultation as unknown as Consultation;
      }
    },
    onSuccess: (newConsultation) => {
      // Invalider toutes les listes
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      // Invalider les consultations du patient
      queryClient.invalidateQueries({
        queryKey: consultationKeys.byPatient(newConsultation.patientId),
      });
      // Invalider "mes consultations" si c'est le patient connecté
      queryClient.invalidateQueries({ queryKey: consultationKeys.me() });
    },
  });
}

// ==================== UPDATE CONSULTATION (Offline-capable) ====================
export function useUpdateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async ({
      id,
      data: consultationData,
    }: {
      id: string;
      data: Partial<CreateConsultationData>;
    }): Promise<Consultation> => {
      // Vérifier le statut online EN TEMPS RÉEL
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        const { data } = await api.patch<Consultation>(`/consultations/${id}`, consultationData);
        return data;
      } else {
        // MODE OFFLINE: Mettre à jour dans IndexedDB
        const now = new Date().toISOString();

        // Récupérer la consultation existante
        const existing = await db.consultations.get(id);
        if (!existing) {
          throw new Error('Consultation introuvable');
        }

        // Vérifier si c'est une consultation créée offline (tempId existe)
        const isOfflineCreated = !!existing.tempId;

        if (isOfflineCreated) {
          // CAS 1: Consultation créée offline (tempId existe)
          // → MAJ directe dans IndexedDB + MAJ dans queue

          const updated: ConsultationLocal = {
            ...existing,
            ...consultationData,
            prescriptions: (consultationData.prescriptions || existing.prescriptions) as any,
            updatedAt: now,
            lastModified: now,
            // syncStatus reste 'pending'
          };

          await db.consultations.put(updated);

          // Mettre à jour dans la queue si elle existe
          const queueItem = await db.syncQueue
            .where('entityId').equals(id)
            .first();

          if (queueItem && queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              data: updated
            });
          }

          return updated as unknown as Consultation;

        } else {
          // CAS 2: Consultation déjà synced
          // → Marquer comme modifiée + ajouter UPDATE à la queue

          const updated: ConsultationLocal = {
            ...existing,
            ...consultationData,
            prescriptions: (consultationData.prescriptions || existing.prescriptions) as any,
            updatedAt: now,
            lastModified: now,
            syncStatus: 'pending', // Marquer comme non synced
          };

          await db.consultations.put(updated);

          // Ajouter opération UPDATE à la queue
          await db.syncQueue.add({
            entity: 'consultation',
            operation: 'update',
            entityId: id,
            data: consultationData, // Seulement les champs modifiés
            createdAt: now,
            attempts: 0
          });

          return updated as unknown as Consultation;
        }
      }
    },
    onSuccess: (updatedConsultation) => {
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      // Invalider le détail
      queryClient.invalidateQueries({
        queryKey: consultationKeys.detail(updatedConsultation.id),
      });
      // Invalider les consultations du patient
      queryClient.invalidateQueries({
        queryKey: consultationKeys.byPatient(updatedConsultation.patientId),
      });
      // Invalider "mes consultations"
      queryClient.invalidateQueries({ queryKey: consultationKeys.me() });
    },
  });
}

// ==================== DELETE CONSULTATION (Offline-capable) ====================
export function useDeleteConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async (id: string): Promise<void> => {
      // Vérifier le statut online EN TEMPS RÉEL
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        await api.delete(`/consultations/${id}`);
      } else {
        // MODE OFFLINE: Soft delete local
        const now = new Date().toISOString();

        // Récupérer la consultation
        const existing = await db.consultations.get(id);
        if (!existing) {
          throw new Error('Consultation introuvable');
        }

        // Vérifier si c'est une consultation créée offline (tempId existe)
        const isOfflineCreated = !!existing.tempId;

        if (isOfflineCreated) {
          // CAS 1: Consultation jamais synced (tempId existe)
          // → Supprimer complètement de IndexedDB + queue

          await db.consultations.delete(id);

          // Supprimer de la queue
          await db.syncQueue
            .where('entityId').equals(id)
            .delete();

        } else {
          // CAS 2: Consultation déjà synced
          // → Soft delete (marquer comme deleted) + ajouter DELETE à la queue

          const deleted: ConsultationLocal = {
            ...existing,
            isDeleted: true,           // Marquer comme supprimé
            deletedAt: now,            // Date de suppression
            syncStatus: 'pending',     // À synchroniser
            lastModified: now,
            updatedAt: now
          };

          await db.consultations.put(deleted);

          // Ajouter opération DELETE à la queue
          await db.syncQueue.add({
            entity: 'consultation',
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
      // Invalider toutes les listes et détails
      queryClient.invalidateQueries({ queryKey: consultationKeys.all });
    },
  });
}
