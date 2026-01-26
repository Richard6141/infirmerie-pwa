import { cn } from '@/lib/utils';
import { Clock, AlertCircle } from 'lucide-react';
import type { CreneauDisponible } from '@/types/creneau';

interface TimeSlotPickerProps {
  creneaux: CreneauDisponible[];
  selectedSlot: string | null;
  onSelectSlot: (heureDebut: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function TimeSlotPicker({
  creneaux,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
  disabled = false,
}: TimeSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-slate-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (creneaux.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500 bg-slate-50 rounded-lg">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>Aucun créneau disponible pour cette date</span>
      </div>
    );
  }

  // Grouper les créneaux par période
  const matin = creneaux.filter((c) => {
    const heure = parseInt(c.heureDebut.split(':')[0]);
    return heure < 12;
  });
  const midi = creneaux.filter((c) => {
    const heure = parseInt(c.heureDebut.split(':')[0]);
    return heure === 12;
  });
  const apresMidi = creneaux.filter((c) => {
    const heure = parseInt(c.heureDebut.split(':')[0]);
    return heure > 12;
  });

  const renderCreneaux = (slots: CreneauDisponible[], title: string) => {
    if (slots.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-600 mb-2">{title}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {slots.map((creneau) => {
            const isSelected = selectedSlot === creneau.heureDebut;
            const isDisabled = !creneau.disponible || disabled;

            return (
              <button
                key={creneau.heureDebut}
                type="button"
                onClick={() => !isDisabled && onSelectSlot(creneau.heureDebut)}
                disabled={isDisabled}
                title={creneau.raison}
                className={cn(
                  'relative flex items-center justify-center h-12 rounded-lg text-sm font-medium transition-all',
                  'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  {
                    // Disponible et non sélectionné
                    'bg-white border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 focus:ring-green-500':
                      creneau.disponible && !isSelected && !disabled,
                    // Sélectionné
                    'bg-blue-600 border-blue-600 text-white shadow-md':
                      isSelected,
                    // Non disponible
                    'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed':
                      !creneau.disponible,
                    // Désactivé
                    'opacity-50 cursor-not-allowed': disabled,
                  }
                )}
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                {creneau.heureDebut}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderCreneaux(matin, 'Matin')}
      {renderCreneaux(midi, 'Midi')}
      {renderCreneaux(apresMidi, 'Après-midi')}

      {/* Légende */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-white border-2 border-green-200" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-600" />
          <span>Sélectionné</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-200" />
          <span>Indisponible</span>
        </div>
      </div>
    </div>
  );
}
