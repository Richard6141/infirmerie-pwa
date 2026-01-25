import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useOnlineStatus } from './useOnlineStatus';
import type {
    SuiviConstantes,
    SuiviConstantesFilters,
    SuiviConstantesResponse,
    CreateSuiviConstantesDTO,
    UpdateSuiviConstantesDTO,
    EvolutionData,
} from '@/types/suivi-constantes';

// Query keys
export const suiviConstantesKeys = {
    all: ['suivi-constantes'] as const,
    lists: () => [...suiviConstantesKeys.all, 'list'] as const,
    list: (filters: SuiviConstantesFilters) => [...suiviConstantesKeys.lists(), filters] as const,
    details: () => [...suiviConstantesKeys.all, 'detail'] as const,
    detail: (id: string) => [...suiviConstantesKeys.details(), id] as const,
    byPatient: (patientId: string) => [...suiviConstantesKeys.all, 'patient', patientId] as const,
    evolution: (patientId: string, limit?: number) =>
        [...suiviConstantesKeys.all, 'evolution', patientId, limit] as const,
};

// ==================== GET SUIVI CONSTANTES (Liste avec filtres) ====================
export function useSuiviConstantes(filters: SuiviConstantesFilters = {}) {
    const isOnline = useOnlineStatus();

    return useQuery({
        queryKey: suiviConstantesKeys.list(filters),
        networkMode: 'offlineFirst',
        queryFn: async (): Promise<SuiviConstantesResponse> => {
            // MODE OFFLINE: Lire depuis IndexedDB
            if (!isOnline) {
                // Note: Pour l'instant, pas de support offline pour suivi-constantes
                // On pourrait l'ajouter plus tard si nécessaire
                return {
                    data: [],
                    page: 1,
                    total: 0,
                    totalPages: 0,
                };
            }

            // MODE ONLINE: API
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.patientId) params.append('patientId', filters.patientId);
            if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
            if (filters.dateFin) params.append('dateFin', filters.dateFin);
            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());

            const url = `/suivi-constantes?${params.toString()}`;
            const { data } = await api.get<SuiviConstantesResponse>(url);
            return data;
        },
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
}

// ==================== GET SUIVI CONSTANTES BY PATIENT ====================
export function useSuiviConstantesByPatient(patientId: string | undefined) {
    const isOnline = useOnlineStatus();

    return useQuery({
        queryKey: suiviConstantesKeys.byPatient(patientId!),
        networkMode: 'offlineFirst',
        enabled: !!patientId,
        queryFn: async (): Promise<SuiviConstantes[]> => {
            if (!patientId) throw new Error('Patient ID manquant');

            // MODE OFFLINE: Pas de support pour l'instant
            if (!isOnline) {
                return [];
            }

            // MODE ONLINE: API
            const { data } = await api.get<SuiviConstantes[]>(`/suivi-constantes/patient/${patientId}`);
            return data;
        },
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
}

// ==================== GET EVOLUTION DATA ====================
export function useEvolutionConstantes(patientId: string | undefined, limit: number = 30) {
    const isOnline = useOnlineStatus();

    return useQuery({
        queryKey: suiviConstantesKeys.evolution(patientId!, limit),
        networkMode: 'offlineFirst',
        enabled: !!patientId,
        queryFn: async (): Promise<EvolutionData> => {
            if (!patientId) throw new Error('Patient ID manquant');

            // MODE OFFLINE: Pas de support pour l'instant
            if (!isOnline) {
                return {
                    patientId: patientId,
                    nomPatient: '',
                    periode: { debut: '', fin: '' },
                    tensionSystolique: [],
                    tensionDiastolique: [],
                    frequenceCardiaque: [],
                    temperature: [],
                    saturationOxygene: [],
                    glycemie: [],
                    poids: [],
                    imc: [],
                    stats: {},
                } as unknown as EvolutionData;
            }

            // MODE ONLINE: API
            const params = new URLSearchParams();
            params.append('limit', limit.toString());

            const { data } = await api.get<EvolutionData>(
                `/suivi-constantes/evolution/${patientId}?${params.toString()}`
            );
            return data;
        },
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
}

// ==================== GET SUIVI CONSTANTES (Détail par ID) ====================
export function useSuiviConstante(id: string | undefined) {
    const isOnline = useOnlineStatus();

    return useQuery({
        queryKey: suiviConstantesKeys.detail(id!),
        networkMode: 'offlineFirst',
        enabled: !!id,
        queryFn: async (): Promise<SuiviConstantes> => {
            if (!id) throw new Error('Suivi constantes ID manquant');

            // MODE OFFLINE: Pas de support pour l'instant
            if (!isOnline) {
                throw new Error('Fonctionnalité non disponible hors ligne');
            }

            // MODE ONLINE: API
            const { data } = await api.get<SuiviConstantes>(`/suivi-constantes/${id}`);
            return data;
        },
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
}

// ==================== CREATE SUIVI CONSTANTES ====================
export function useCreateSuiviConstantes() {
    const queryClient = useQueryClient();

    return useMutation({
        networkMode: 'online', // Nécessite une connexion
        mutationFn: async (data: CreateSuiviConstantesDTO): Promise<SuiviConstantes> => {
            const { data: response } = await api.post<SuiviConstantes>('/suivi-constantes', data);
            return response;
        },
        onSuccess: (newConstante) => {
            // Invalider toutes les listes
            queryClient.invalidateQueries({ queryKey: suiviConstantesKeys.lists() });

            // Invalider les données du patient concerné
            if (newConstante.patientId) {
                queryClient.invalidateQueries({
                    queryKey: suiviConstantesKeys.byPatient(newConstante.patientId)
                });
                queryClient.invalidateQueries({
                    queryKey: suiviConstantesKeys.evolution(newConstante.patientId)
                });
            }
        },
    });
}

// ==================== UPDATE SUIVI CONSTANTES ====================
export function useUpdateSuiviConstantes() {
    const queryClient = useQueryClient();

    return useMutation({
        networkMode: 'online', // Nécessite une connexion
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: UpdateSuiviConstantesDTO;
        }): Promise<SuiviConstantes> => {
            const { data: response } = await api.patch<SuiviConstantes>(
                `/suivi-constantes/${id}`,
                data
            );
            return response;
        },
        onSuccess: (updatedConstante) => {
            // Invalider les listes
            queryClient.invalidateQueries({ queryKey: suiviConstantesKeys.lists() });

            // Invalider le détail
            queryClient.invalidateQueries({
                queryKey: suiviConstantesKeys.detail(updatedConstante.id)
            });

            // Invalider les données du patient
            if (updatedConstante.patientId) {
                queryClient.invalidateQueries({
                    queryKey: suiviConstantesKeys.byPatient(updatedConstante.patientId)
                });
                queryClient.invalidateQueries({
                    queryKey: suiviConstantesKeys.evolution(updatedConstante.patientId)
                });
            }
        },
    });
}

// ==================== DELETE SUIVI CONSTANTES ====================
export function useDeleteSuiviConstantes() {
    const queryClient = useQueryClient();

    return useMutation({
        networkMode: 'online', // Nécessite une connexion
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/suivi-constantes/${id}`);
        },
        onSuccess: () => {
            // Invalider toutes les queries liées
            queryClient.invalidateQueries({ queryKey: suiviConstantesKeys.all });
        },
    });
}
