import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { db } from '../db/schema';
import { useOnlineStatus } from './useOnlineStatus';
import { useAuthStore } from '../stores/authStore';
import type {
  Patient,
  PatientFilters,
  PatientsResponse,
  CreatePatientDTO,
  UpdatePatientDTO,
} from '@/types/patient';

// Query keys
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: PatientFilters) => [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  me: () => [...patientKeys.all, 'me'] as const,
};

// ==================== GET PATIENTS (Liste avec filtres) ====================
export function usePatients(filters: PatientFilters = {}) {
  // Note: useOnlineStatus peut être undefined lors du SSR ou init, on gère le cas
  const isOnlineHook = useOnlineStatus();
  const isOnline = typeof isOnlineHook === 'boolean' ? isOnlineHook : true;

  return useQuery({
    queryKey: patientKeys.list(filters),
    networkMode: 'offlineFirst',
    queryFn: async (): Promise<PatientsResponse> => {
      // MODE OFFLINE: Lire depuis IndexedDB
      if (!isOnline) {
        let patients = await db.patients
          .filter((p: any) => !p.isDeleted)
          .toArray();

        // Appliquer les filtres basiques
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          patients = patients.filter((p: any) =>
            p.nom?.toLowerCase().includes(searchLower) ||
            p.prenom?.toLowerCase().includes(searchLower) ||
            p.matricule?.toLowerCase().includes(searchLower)
          );
        }

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const total = patients.length;
        const totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit;
        const end = start + limit;

        return {
          data: patients.slice(start, end),
          page,
          total,
          totalPages,
        } as PatientsResponse;
      }

      // MODE ONLINE
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.sexe) params.append('sexe', filters.sexe);
      if (filters.groupeSanguin) params.append('groupeSanguin', filters.groupeSanguin);
      if (filters.direction) params.append('direction', filters.direction);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get<PatientsResponse>(`/patients?${params.toString()}`);

      // Sync cache
      if (response.data.data) {
        try {
          await db.patients.bulkPut(response.data.data.map(p => ({ ...p, isDeleted: false, syncStatus: 'synced' as const, lastModified: new Date().toISOString() })));
        } catch (e) {
          console.error('Cache error', e);
        }
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== GET PATIENT DETAILS ====================
export function usePatient(id?: string) {
  const isOnlineHook = useOnlineStatus();
  const isOnline = typeof isOnlineHook === 'boolean' ? isOnlineHook : true;

  return useQuery({
    queryKey: patientKeys.detail(id || ''),
    enabled: !!id,
    networkMode: 'offlineFirst',
    queryFn: async (): Promise<Patient> => {
      if (!isOnline && id) {
        const patient = await db.patients.get(id);
        if (patient) return patient as unknown as Patient;
        throw new Error('Patient non trouvé hors ligne');
      }

      const response = await api.get<Patient>(`/patients/${id}`);
      if (response.data) {
        try {
          await db.patients.put({ ...response.data, isDeleted: false, syncStatus: 'synced' as const, lastModified: new Date().toISOString() });
        } catch (e) { console.error(e); }
      }
      return response.data;
    },
  });
}

// ==================== GET CURRENT PATIENT PROFILE (New) ====================
export function useMyPatientProfile() {
  // Importer le store d'authentification pour vérifier le rôle
  const { isPatient } = useAuthStore();

  return useQuery({
    queryKey: patientKeys.me(),
    retry: 1,
    // Ne faire la requête que si l'utilisateur est un patient
    enabled: isPatient(),
    queryFn: async (): Promise<Patient> => {
      // Tenter la route standard /patients/me
      // Si elle n'existe pas, le backend renverra 404, et on gérera l'erreur dans l'UI
      const response = await api.get<Patient>('/patients/me');
      return response.data;
    },
  });
}

// ==================== CREATE PATIENT ====================
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPatient: CreatePatientDTO) => {
      const { data } = await api.post<Patient>('/patients', newPatient);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    }
  });
}

// ==================== UPDATE PATIENT ====================
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePatientDTO }) => {
      const response = await api.patch<Patient>(`/patients/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedPatient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(updatedPatient.id) });
      queryClient.invalidateQueries({ queryKey: patientKeys.me() });
    }
  });
}

// ==================== DELETE PATIENT ====================
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    }
  });
}
