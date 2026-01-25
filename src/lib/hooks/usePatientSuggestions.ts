import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { Patient } from '@/types/patient';

// Hook pour récupérer les suggestions de valeurs uniques
export function usePatientSuggestions() {
  return useQuery({
    queryKey: ['patient-suggestions'],
    queryFn: async () => {
      // Récupérer tous les patients (sans pagination pour avoir toutes les valeurs)
      const { data } = await api.get<{ data: Patient[] }>('/patients?limit=1000');

      const patients = data.data;

      // Extraire les valeurs uniques
      const directions = [...new Set(
        patients
          .map(p => p.direction)
          .filter(Boolean)
      )].sort();

      const allergies = [...new Set(
        patients
          .map(p => p.allergies)
          .filter((a): a is string => Boolean(a))
          .flatMap(a => a.split(',').map(s => s.trim()))
      )].sort();

      const antecedents = [...new Set(
        patients
          .map(p => p.antecedents || p.antecedentsMedicaux)
          .filter((a): a is string => Boolean(a) && typeof a === 'string')
          .flatMap(a => a.split(',').map(s => s.trim()))
      )].sort();

      return {
        directions,
        allergies,
        antecedents,
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (ces données changent rarement)
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
