import { api } from '../api';
import type { CreneauBloque, CreateCreneauBloqueData } from '../../types/creneau';

/**
 * Récupérer tous les créneaux bloqués
 */
export async function getCreneauxBloques(): Promise<CreneauBloque[]> {
  const response = await api.get<CreneauBloque[]>('/creneaux-bloques');
  return response.data;
}

/**
 * Récupérer les créneaux bloqués actifs
 */
export async function getCreneauxBloquesActifs(): Promise<CreneauBloque[]> {
  const response = await api.get<CreneauBloque[]>('/creneaux-bloques/active');
  return response.data;
}

/**
 * Créer un créneau bloqué
 */
export async function createCreneauBloque(
  data: CreateCreneauBloqueData
): Promise<CreneauBloque> {
  const response = await api.post<CreneauBloque>('/creneaux-bloques', data);
  return response.data;
}

/**
 * Supprimer un créneau bloqué
 */
export async function deleteCreneauBloque(id: string): Promise<void> {
  await api.delete(`/creneaux-bloques/${id}`);
}
