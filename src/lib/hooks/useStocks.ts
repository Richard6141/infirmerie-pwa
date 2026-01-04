import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useOnlineStatus } from './useOnlineStatus';
import type {
  StocksResponse,
  StockFilters,
  MouvementsStockResponse,
  MouvementStockFilters,
  CreateMouvementStockData,
  MouvementStock,
  UpdateConfigurationStockData,
  StockAlertes,
} from '@/types/stock';

// ==================== QUERY KEYS ====================

export const stockKeys = {
  all: ['stocks'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  list: (filters: StockFilters) => [...stockKeys.lists(), filters] as const,
  alertes: () => [...stockKeys.all, 'alertes'] as const,
  mouvements: {
    all: ['mouvements-stock'] as const,
    lists: () => [...stockKeys.mouvements.all, 'list'] as const,
    list: (filters: MouvementStockFilters) => [...stockKeys.mouvements.lists(), filters] as const,
  },
};

// ==================== GET STOCKS ====================

export function useStocks(filters: StockFilters = {}) {
  const isOnline = useOnlineStatus();

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as StockFilters;

  return useQuery({
    queryKey: stockKeys.list(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<StocksResponse> => {
      const url = '/stocks';
      const { data } = await api.get<StocksResponse>(url, {
        params: cleanFilters,
      });
      return data;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

// ==================== GET ALERTES STOCK ====================

export function useStockAlertes() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: stockKeys.alertes(),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<StockAlertes> => {
      const { data } = await api.get<StockAlertes>('/stocks/alertes');
      return data;
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ==================== UPDATE CONFIGURATION STOCK ====================

export function useUpdateConfigurationStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      medicamentId,
      data,
    }: {
      medicamentId: string;
      data: UpdateConfigurationStockData;
    }) => {
      const response = await api.patch('/stocks/' + medicamentId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockKeys.alertes() });
    },
  });
}

// ==================== MOUVEMENTS STOCK ====================

export function useMouvementsStock(filters: MouvementStockFilters = {}) {
  const isOnline = useOnlineStatus();

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as MouvementStockFilters;

  return useQuery({
    queryKey: stockKeys.mouvements.list(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<MouvementsStockResponse> => {
      let url: string;
      const requestParams = { ...cleanFilters };

      if (cleanFilters.medicamentId) {
        url = `/stocks/medicament/${cleanFilters.medicamentId}/mouvements`;
        // Remove medicamentId from query params since it's in the path
        delete requestParams.medicamentId;
      } else {
        url = '/stocks/mouvements/all';
      }

      const { data } = await api.get<MouvementsStockResponse>(url, {
        params: requestParams,
      });
      return data;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

// ==================== CREATE MOUVEMENT STOCK ====================

export function useCreateMouvementStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMouvementStockData): Promise<MouvementStock> => {
      const response = await api.post<MouvementStock>('/stocks/mouvements', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockKeys.alertes() });
      queryClient.invalidateQueries({ queryKey: stockKeys.mouvements.lists() });
    },
  });
}
