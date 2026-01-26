import { useState } from 'react';
import { CalendarOff, Plus, Trash2, Clock, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreneauxBloques,
  useCreateCreneauBloque,
  useDeleteCreneauBloque,
} from '@/lib/hooks/useCreneauxBloques';
import { cn } from '@/lib/utils';
import type { CreateCreneauBloqueData } from '@/types/creneau';

const JOURS_SEMAINE = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export default function CreneauxBloquesPage() {
  const [showForm, setShowForm] = useState(false);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [formData, setFormData] = useState<CreateCreneauBloqueData>({
    dateDebut: '',
    dateFin: '',
    motif: '',
    isRecurrent: false,
    jourSemaine: 1,
  });

  const { data: creneauxBloques, isLoading } = useCreneauxBloques();
  const createMutation = useCreateCreneauBloque();
  const deleteMutation = useDeleteCreneauBloque();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        ...formData,
        isRecurrent,
        jourSemaine: isRecurrent ? formData.jourSemaine : undefined,
      });

      toast.success('Blocage créé avec succès');
      setShowForm(false);
      setFormData({
        dateDebut: '',
        dateFin: '',
        motif: '',
        isRecurrent: false,
        jourSemaine: 1,
      });
      setIsRecurrent(false);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erreur lors de la création du blocage';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce blocage ?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Blocage supprimé');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Séparer les blocages récurrents et ponctuels
  const blocagesRecurrents = creneauxBloques?.filter((b) => b.isRecurrent) || [];
  const blocagesPonctuels = creneauxBloques?.filter((b) => !b.isRecurrent) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarOff className="h-6 w-6 text-red-500" />
              Gestion des blocages
            </h1>
            <p className="text-slate-500 mt-1">
              Bloquez des créneaux pour les rendre indisponibles à la prise de rendez-vous
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau blocage
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
        {/* Formulaire de création */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Créer un blocage
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type de blocage */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={!isRecurrent}
                    onChange={() => setIsRecurrent(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Ponctuel (date spécifique)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={isRecurrent}
                    onChange={() => setIsRecurrent(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Récurrent (chaque semaine)
                  </span>
                </label>
              </div>

              {isRecurrent ? (
                <>
                  {/* Jour de la semaine */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Jour de la semaine
                    </label>
                    <select
                      value={formData.jourSemaine}
                      onChange={(e) =>
                        setFormData({ ...formData, jourSemaine: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {JOURS_SEMAINE.map((jour) => (
                        <option key={jour.value} value={jour.value}>
                          {jour.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Heures pour récurrent */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Heure de début
                      </label>
                      <input
                        type="time"
                        value={formData.dateDebut.split('T')[1]?.slice(0, 5) || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateDebut: `2000-01-01T${e.target.value}:00`,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Heure de fin
                      </label>
                      <input
                        type="time"
                        value={formData.dateFin.split('T')[1]?.slice(0, 5) || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateFin: `2000-01-01T${e.target.value}:00`,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Date/Heure début */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date et heure de début
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dateDebut.slice(0, 16)}
                      onChange={(e) =>
                        setFormData({ ...formData, dateDebut: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Date/Heure fin */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date et heure de fin
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dateFin.slice(0, 16)}
                      onChange={(e) =>
                        setFormData({ ...formData, dateFin: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Motif (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.motif}
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                  placeholder="Ex: Formation, Congé, Réunion..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Créer le blocage
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des blocages */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : creneauxBloques && creneauxBloques.length > 0 ? (
          <div className="space-y-6">
            {/* Blocages récurrents */}
            {blocagesRecurrents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-purple-500" />
                  Blocages récurrents
                </h3>
                <div className="bg-white rounded-xl shadow-sm border divide-y">
                  {blocagesRecurrents.map((blocage) => (
                    <div
                      key={blocage.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            Tous les {blocage.jourSemaineLibelle}
                          </p>
                          <p className="text-sm text-slate-500">
                            <Clock className="inline h-3.5 w-3.5 mr-1" />
                            {formatTime(blocage.dateDebut)} - {formatTime(blocage.dateFin)}
                            {blocage.motif && (
                              <span className="ml-2 text-purple-600">• {blocage.motif}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(blocage.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blocages ponctuels */}
            {blocagesPonctuels.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  Blocages ponctuels
                </h3>
                <div className="bg-white rounded-xl shadow-sm border divide-y">
                  {blocagesPonctuels.map((blocage) => {
                    const isPast = new Date(blocage.dateFin) < new Date();
                    return (
                      <div
                        key={blocage.id}
                        className={cn(
                          'flex items-center justify-between p-4',
                          isPast && 'opacity-50'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {formatDate(blocage.dateDebut)}
                              {formatDate(blocage.dateDebut) !== formatDate(blocage.dateFin) && (
                                <> - {formatDate(blocage.dateFin)}</>
                              )}
                            </p>
                            <p className="text-sm text-slate-500">
                              <Clock className="inline h-3.5 w-3.5 mr-1" />
                              {formatTime(blocage.dateDebut)} - {formatTime(blocage.dateFin)}
                              {blocage.motif && (
                                <span className="ml-2 text-orange-600">• {blocage.motif}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(blocage.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CalendarOff className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucun blocage configuré</p>
            <p className="text-sm">
              Les patients peuvent prendre rendez-vous sur tous les créneaux disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
