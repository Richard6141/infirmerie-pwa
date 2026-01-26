import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, FileText, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreneauxDisponibles } from '@/lib/hooks/useCreneauxDisponibles';
import { useCreateRendezVousPatient } from '@/lib/hooks/useRendezVous';
import { TimeSlotPicker } from '@/components/rendez-vous/TimeSlotPicker';
import { cn } from '@/lib/utils';

export default function PatientPriseRendezVousPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: creneauxData, isLoading: loadingCreneaux } = useCreneauxDisponibles(
    selectedDate || null
  );
  const createRdv = useCreateRendezVousPatient();

  // Obtenir la date minimale (demain)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Obtenir la date maximale (3 mois)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setSelectedSlot(null); // Réinitialiser le créneau sélectionné
  };

  const handleSlotSelect = (heureDebut: string) => {
    setSelectedSlot(heureDebut);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedSlot || motif.length < 10) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;

    // Construire la date/heure complète
    const dateHeure = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();

    try {
      await createRdv.mutateAsync({
        dateHeure,
        motif,
      });

      toast.success('Rendez-vous pris avec succès !');
      navigate('/rendez-vous');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erreur lors de la prise de rendez-vous';
      toast.error(message);
      setShowConfirmation(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Prendre un rendez-vous</h1>
          <p className="text-slate-500 mt-1">
            Sélectionnez une date et un créneau horaire disponible
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Étape 1: Sélection de la date */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                1
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                Choisir une date
              </h2>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {selectedDate && (
              <p className="mt-2 text-sm text-slate-600">
                <Calendar className="inline h-4 w-4 mr-1" />
                {formatDateDisplay(selectedDate)}
              </p>
            )}
          </div>

          {/* Étape 2: Sélection du créneau */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
                  selectedDate
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                2
              </div>
              <h2
                className={cn(
                  'text-lg font-semibold',
                  selectedDate ? 'text-slate-800' : 'text-slate-400'
                )}
              >
                Choisir un créneau
              </h2>
            </div>

            {!selectedDate ? (
              <div className="flex items-center justify-center p-8 text-slate-400 bg-slate-50 rounded-lg">
                <Clock className="h-5 w-5 mr-2" />
                <span>Veuillez d'abord sélectionner une date</span>
              </div>
            ) : !creneauxData?.isJourOuvre ? (
              <div className="flex items-center justify-center p-8 text-amber-600 bg-amber-50 rounded-lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{creneauxData?.raisonNonOuvre || 'Jour non ouvré'}</span>
              </div>
            ) : (
              <TimeSlotPicker
                creneaux={creneauxData?.creneaux || []}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSlotSelect}
                isLoading={loadingCreneaux}
              />
            )}
          </div>

          {/* Étape 3: Motif de consultation */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
                  selectedSlot
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                3
              </div>
              <h2
                className={cn(
                  'text-lg font-semibold',
                  selectedSlot ? 'text-slate-800' : 'text-slate-400'
                )}
              >
                Motif de consultation
              </h2>
            </div>

            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Décrivez brièvement le motif de votre consultation (minimum 10 caractères)"
                className={cn(
                  'w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none',
                  !selectedSlot && 'bg-slate-50 cursor-not-allowed'
                )}
                disabled={!selectedSlot}
                required
                minLength={10}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {motif.length}/10 caractères minimum
            </p>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={!selectedDate || !selectedSlot || motif.length < 10}
            className={cn(
              'w-full py-4 rounded-xl font-semibold text-white transition-all',
              'flex items-center justify-center gap-2',
              selectedDate && selectedSlot && motif.length >= 10
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-slate-300 cursor-not-allowed'
            )}
          >
            <CheckCircle className="h-5 w-5" />
            Confirmer le rendez-vous
          </button>
        </form>
      </div>

      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Confirmer votre rendez-vous
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium text-slate-800">
                    {formatDateDisplay(selectedDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-500">Heure</p>
                  <p className="font-medium text-slate-800">{selectedSlot}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Motif</p>
                  <p className="font-medium text-slate-800">{motif}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={createRdv.isPending}
                className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={createRdv.isPending}
                className="flex-1 py-3 bg-blue-600 rounded-xl font-medium text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {createRdv.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
