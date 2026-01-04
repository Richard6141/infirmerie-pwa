import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useOnlineStatus } from './useOnlineStatus';

// Types pour les statistiques
export interface DashboardStats {
  patients: {
    total: number;
    nouveaux: number; // Ce mois
  };
  consultations: {
    total: number;
    ceJour: number;
    ceMois: number;
  };
  medicaments: {
    total: number;
  };
  stocks: {
    total: number;
    alertes: number;
  };
  vaccinations: {
    total: number;
    ceMois: number;
  };
  rendezVous: {
    total: number;
    ceJour: number;
    aVenir: number;
  };
}

// Hook pour récupérer les statistiques du dashboard
export function useDashboardStats() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    enabled: isOnline,
    queryFn: async (): Promise<DashboardStats> => {
      // Récupérer toutes les données en parallèle
      const [
        patientsRes,
        consultationsRes,
        medicamentsRes,
        stocksRes,
        vaccinationsRes,
        rendezVousRes,
      ] = await Promise.allSettled([
        api.get('/patients?page=1&limit=1'),
        api.get('/consultations?page=1&limit=1'),
        api.get('/medicaments?page=1&limit=1'),
        api.get('/stocks?page=1&limit=1'),
        api.get('/vaccinations?page=1&limit=1'),
        api.get('/rendez-vous?page=1&limit=1'),
      ]);

      // Date actuelle et début du mois
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Récupérer les données filtrées
      const [
        nouveauxPatientsRes,
        consultationsCeJourRes,
        consultationsCeMoisRes,
        vaccinationsCeMoisRes,
        rendezVousCeJourRes,
        rendezVousAVenirRes,
        alertesStocksRes,
      ] = await Promise.allSettled([
        api.get(`/patients?startDate=${startOfMonth}`),
        api.get(`/consultations?startDate=${today}`),
        api.get(`/consultations?startDate=${startOfMonth}`),
        api.get(`/vaccinations?startDate=${startOfMonth}`),
        api.get(`/rendez-vous?date=${today.split('T')[0]}`),
        api.get(`/rendez-vous?statut=PLANIFIE`),
        api.get('/stocks/alertes'),
      ]);

      // Parser les résultats
      const getTotal = (result: PromiseSettledResult<any>) =>
        result.status === 'fulfilled' ? result.value.data?.total || result.value.data?.pagination?.total || 0 : 0;

      const getData = (result: PromiseSettledResult<any>) =>
        result.status === 'fulfilled' ? result.value.data?.data || result.value.data || [] : [];

      const getAlertes = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          const data = result.value.data;
          const ruptures = data?.ruptures?.length || 0;
          const critiques = data?.critiques?.length || 0;
          const bas = data?.bas?.length || 0;
          return ruptures + critiques + bas;
        }
        return 0;
      };

      return {
        patients: {
          total: getTotal(patientsRes),
          nouveaux: getData(nouveauxPatientsRes).length,
        },
        consultations: {
          total: getTotal(consultationsRes),
          ceJour: getData(consultationsCeJourRes).length,
          ceMois: getData(consultationsCeMoisRes).length,
        },
        medicaments: {
          total: getTotal(medicamentsRes),
        },
        stocks: {
          total: getTotal(stocksRes),
          alertes: getAlertes(alertesStocksRes),
        },
        vaccinations: {
          total: getTotal(vaccinationsRes),
          ceMois: getData(vaccinationsCeMoisRes).length,
        },
        rendezVous: {
          total: getTotal(rendezVousRes),
          ceJour: getData(rendezVousCeJourRes).length,
          aVenir: getData(rendezVousAVenirRes).length,
        },
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
