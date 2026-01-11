import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { db } from '../db/schema';
import { useOnlineStatus } from './useOnlineStatus';
import type {
  Vaccination,
  VaccinationsResponse,
  VaccinationFilters,
  CreateVaccinationData,
  UpdateVaccinationData,
  RappelsResponse,
  RappelFilters,
} from '@/types/vaccination';
import type { VaccinationLocal } from '../db/schema';

export const vaccinationKeys = {
  all: ['vaccinations'] as const,
  lists: () => [...vaccinationKeys.all, 'list'] as const,
  list: (filters: VaccinationFilters) => [...vaccinationKeys.lists(), filters] as const,
  details: () => [...vaccinationKeys.all, 'detail'] as const,
  detail: (id: string) => [...vaccinationKeys.details(), id] as const,
  byPatient: (patientId: string) => [...vaccinationKeys.all, 'patient', patientId] as const,
  rappels: (filters: RappelFilters) => [...vaccinationKeys.all, 'rappels', filters] as const,
  stats: () => [...vaccinationKeys.all, 'stats'] as const,
};

export function useVaccinations(filters: VaccinationFilters = {}) {
  const isOnline = useOnlineStatus();

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as VaccinationFilters;

  return useQuery({
    queryKey: vaccinationKeys.list(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<VaccinationsResponse> => {
      const params = new URLSearchParams();
      if (cleanFilters.search) params.append('search', cleanFilters.search);
      if (cleanFilters.typeVaccin) params.append('typeVaccin', cleanFilters.typeVaccin);
      if (cleanFilters.patientId) params.append('patientId', cleanFilters.patientId);
      if (cleanFilters.startDate) params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);
      if (cleanFilters.page) params.append('page', cleanFilters.page.toString());
      if (cleanFilters.limit) params.append('limit', cleanFilters.limit.toString());
      // Inclure les données du patient
      params.append('include', 'patient');
      const url = '/vaccinations' + (params.toString() ? '?' + params.toString() : '');
      const { data } = await api.get<VaccinationsResponse>(url);
      return data;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

export function useVaccination(id: string) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: vaccinationKeys.detail(id),
    queryFn: async (): Promise<Vaccination> => {
      const { data } = await api.get<Vaccination>('/vaccinations/' + id);
      return data;
    },
    enabled: !!id && isOnline, // Ne fait la requête que si ID existe ET online
    staleTime: 1000 * 60 * 5,
  });
}

export function useRappels(filters: RappelFilters = {}) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: vaccinationKeys.rappels(filters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<RappelsResponse> => {
      const params = new URLSearchParams();
      if (filters.typeVaccin) params.append('typeVaccin', filters.typeVaccin);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.joursAvance) params.append('joursAvance', filters.joursAvance.toString());
      const url = '/vaccinations/rappels' + (params.toString() ? '?' + params.toString() : '');
      const { data } = await api.get<RappelsResponse>(url);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateVaccination() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async (vaccinationData: CreateVaccinationData): Promise<Vaccination> => {
      // Vérifier le statut online EN TEMPS RÉEL
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        const response = await api.post<Vaccination>('/vaccinations', vaccinationData);
        return response.data;
      } else {
        // MODE OFFLINE: IndexedDB + Queue
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        const now = new Date().toISOString();

        const vaccination: VaccinationLocal = {
          id: tempId,
          tempId,
          patientId: vaccinationData.patientId,
          typeVaccin: vaccinationData.typeVaccin,
          dateAdministration: vaccinationData.dateAdministration || now,
          date: vaccinationData.dateAdministration || now, // Compatibilité
          numeroDose: vaccinationData.numeroDose,
          nombreDosesTotal: vaccinationData.nombreDosesTotal,
          numeroLot: vaccinationData.numeroLot,
          prochainRappel: vaccinationData.prochainRappel,
          notes: vaccinationData.notes,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending',
          lastModified: now,
        };

        // Sauvegarder dans IndexedDB
        await db.vaccinations.add(vaccination);

        // Ajouter à la queue de sync
        await db.syncQueue.add({
          entity: 'vaccination',
          operation: 'create',
          entityId: tempId,
          data: vaccination,
          createdAt: now,
          attempts: 0
        });

        // Retourner comme Vaccination pour compatibilité
        return vaccination as unknown as Vaccination;
      }
    },
    onSuccess: (newVaccination) => {
      queryClient.invalidateQueries({ queryKey: vaccinationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vaccinationKeys.rappels({}) });
      if (newVaccination.patientId) {
        queryClient.invalidateQueries({ queryKey: vaccinationKeys.byPatient(newVaccination.patientId) });
      }
    },
  });
}

export function useUpdateVaccination() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async ({ id, data: vaccinationData }: { id: string; data: UpdateVaccinationData }): Promise<Vaccination> => {
      // Vérifier le statut online EN TEMPS RÉEL
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        const response = await api.patch<Vaccination>('/vaccinations/' + id, vaccinationData);
        return response.data;
      } else {
        // MODE OFFLINE: Mettre à jour dans IndexedDB
        const now = new Date().toISOString();

        const existing = await db.vaccinations.get(id);
        if (!existing) {
          throw new Error('Vaccination introuvable');
        }

        const isOfflineCreated = !!existing.tempId;

        if (isOfflineCreated) {
          // CAS 1: Vaccination créée offline
          const updated: VaccinationLocal = {
            ...existing,
            ...vaccinationData,
            updatedAt: now,
            lastModified: now,
          };

          await db.vaccinations.put(updated);

          const queueItem = await db.syncQueue
            .where('entityId').equals(id)
            .first();

          if (queueItem && queueItem.id) {
            await db.syncQueue.update(queueItem.id, {
              data: updated
            });
          }

          return updated as unknown as Vaccination;

        } else {
          // CAS 2: Vaccination déjà synced
          const updated: VaccinationLocal = {
            ...existing,
            ...vaccinationData,
            updatedAt: now,
            lastModified: now,
            syncStatus: 'pending',
          };

          await db.vaccinations.put(updated);

          await db.syncQueue.add({
            entity: 'vaccination',
            operation: 'update',
            entityId: id,
            data: vaccinationData,
            createdAt: now,
            attempts: 0
          });

          return updated as unknown as Vaccination;
        }
      }
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: vaccinationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vaccinationKeys.detail(updated.id) });
    },
  });
}

export function useDeleteVaccination() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always', // IMPORTANT: Permet l'exécution même en mode offline
    mutationFn: async (id: string): Promise<void> => {
      // Vérifier le statut online EN TEMPS RÉEL
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (isOnline) {
        // MODE ONLINE: API normale
        await api.delete('/vaccinations/' + id);
      } else {
        // MODE OFFLINE: Soft delete local
        const now = new Date().toISOString();

        const existing = await db.vaccinations.get(id);
        if (!existing) {
          throw new Error('Vaccination introuvable');
        }

        const isOfflineCreated = !!existing.tempId;

        if (isOfflineCreated) {
          // CAS 1: Vaccination jamais synced
          await db.vaccinations.delete(id);

          await db.syncQueue
            .where('entityId').equals(id)
            .delete();

        } else {
          // CAS 2: Vaccination déjà synced
          const deleted: VaccinationLocal = {
            ...existing,
            isDeleted: true,           // Marquer comme supprimé
            deletedAt: now,            // Date de suppression
            syncStatus: 'pending',     // À synchroniser
            lastModified: now,
            updatedAt: now
          };

          await db.vaccinations.put(deleted);

          await db.syncQueue.add({
            entity: 'vaccination',
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
      queryClient.invalidateQueries({ queryKey: vaccinationKeys.all });
    },
  });
}
