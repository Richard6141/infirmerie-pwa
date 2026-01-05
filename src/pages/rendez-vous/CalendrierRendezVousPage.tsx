import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import { Calendar, Clock, User, FileText, Trash2, Edit, List } from 'lucide-react';
import { useRendezVous, useDeleteRendezVous } from '@/lib/hooks/useRendezVous';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  STATUT_RDV_COLORS,
  STATUT_RDV_LABELS,
  formaterDateRendezVous,
  getNomCompletPatient,
  getNomCompletInfirmier,
  getMatriculePatient,
  getObservations,
  type RendezVous
} from '@/types/rendez-vous';
import { toast } from 'sonner';

export function CalendrierRendezVousPage() {
  const navigate = useNavigate();
  const { isInfirmier } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);

  const [selectedEvent, setSelectedEvent] = useState<RendezVous | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Récupérer tous les rendez-vous (sans pagination pour le calendrier)
  const { data: rdvData, isLoading } = useRendezVous({ limit: 1000 });
  const deleteMutation = useDeleteRendezVous();

  // Convertir les rendez-vous en événements FullCalendar
  const events = useMemo(() => {
    if (!rdvData?.data) return [];

    return rdvData.data.map((rdv) => ({
      id: rdv.id,
      title: isInfirmier
        ? getNomCompletPatient(rdv)
        : `RDV avec ${getNomCompletInfirmier(rdv)}`,
      start: rdv.dateHeure,
      end: rdv.dateHeure, // Pas de durée définie, on peut ajouter +30min par défaut
      backgroundColor: getEventColor(rdv.statut),
      borderColor: getEventBorderColor(rdv.statut),
      textColor: '#ffffff',
      extendedProps: {
        rendezVous: rdv,
      },
      classNames: ['rdv-event', `rdv-${rdv.statut.toLowerCase()}`],
    }));
  }, [rdvData, isInfirmier]);

  // Couleurs modernes et attrayantes selon le statut
  function getEventColor(statut: string): string {
    switch (statut) {
      case 'PLANIFIE':
        return '#3b82f6'; // Bleu vif
      case 'CONFIRME':
        return '#10b981'; // Vert émeraude
      case 'ANNULE':
        return '#ef4444'; // Rouge corail
      case 'TERMINE':
        return '#8b5cf6'; // Violet
      default:
        return '#3b82f6';
    }
  }

  // Bordure plus foncée pour contraste
  function getEventBorderColor(statut: string): string {
    switch (statut) {
      case 'PLANIFIE':
        return '#2563eb'; // Bleu plus foncé
      case 'CONFIRME':
        return '#059669'; // Vert plus foncé
      case 'ANNULE':
        return '#dc2626'; // Rouge plus foncé
      case 'TERMINE':
        return '#7c3aed'; // Violet plus foncé
      default:
        return '#2563eb';
    }
  }

  // Gestion du clic sur un événement
  const handleEventClick = (clickInfo: any) => {
    const rdv = clickInfo.event.extendedProps.rendezVous as RendezVous;
    setSelectedEvent(rdv);
  };

  // Gestion du clic sur une date (création)
  const handleDateClick = (arg: any) => {
    if (!isInfirmier) return; // Seuls les infirmiers peuvent créer

    // Récupérer la date cliquée et définir l'heure par défaut à 09:00
    const clickedDate = arg.date || new Date(arg.dateStr);
    clickedDate.setHours(9, 0, 0, 0); // Par défaut: 09:00

    // Format pour datetime-local: YYYY-MM-DDTHH:mm
    const dateStr = clickedDate.toISOString();
    navigate(`/rendez-vous/nouveau?date=${dateStr}`);
  };

  // Suppression d'un RDV
  const handleDelete = async () => {
    if (!selectedEvent) return;

    try {
      await deleteMutation.mutateAsync(selectedEvent.id);
      toast.success('Rendez-vous supprimé avec succès');
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-3xl font-bold text-slate-800 flex items-center gap-2 md:gap-3">
            <Calendar className="h-5 w-5 md:h-8 md:w-8 text-cyan-600" />
            Calendrier des Rendez-vous
          </h1>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/rendez-vous/liste')}
            >
              <List className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Vue Liste</span>
              <span className="md:hidden">Liste</span>
            </Button>
            {isInfirmier && (
              <Button
                onClick={() => navigate('/rendez-vous/nouveau')}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Nouveau RDV</span>
                <span className="md:hidden">Nouveau</span>
              </Button>
            )}
          </div>
        </div>
        <p className="text-slate-600">
          Vue d'ensemble de tous vos rendez-vous
        </p>
      </div>


      {/* Légende */}
      < Card className="border-slate-200 shadow-sm" >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Légende des statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm group-hover:shadow-md transition-shadow"></div>
              <span className="text-sm font-medium text-slate-700">Planifié</span>
            </div>
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow"></div>
              <span className="text-sm font-medium text-slate-700">Confirmé</span>
            </div>
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-red-500 to-red-600 shadow-sm group-hover:shadow-md transition-shadow"></div>
              <span className="text-sm font-medium text-slate-700">Annulé</span>
            </div>
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm group-hover:shadow-md transition-shadow"></div>
              <span className="text-sm font-medium text-slate-700">Terminé</span>
            </div>
          </div>
        </CardContent>
      </Card >

      {/* Calendrier */}
      < Card className="border-slate-200 shadow-lg" >
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Chargement du calendrier...</p>
              </div>
            </div>
          ) : (
            <div className="calendar-container">
              <style>{`
                .calendar-container .fc {
                  font-family: inherit;
                }

                /* En-tête du calendrier */
                .calendar-container .fc-toolbar-title {
                  font-size: 1.5rem !important;
                  font-weight: 700 !important;
                  color: #1e293b;
                }

                .calendar-container .fc-button {
                  background-color: #0891b2 !important;
                  border-color: #0891b2 !important;
                  text-transform: capitalize !important;
                  padding: 0.5rem 1rem !important;
                  font-weight: 500 !important;
                  transition: all 0.2s !important;
                }

                .calendar-container .fc-button:hover {
                  background-color: #0e7490 !important;
                  border-color: #0e7490 !important;
                  transform: translateY(-1px);
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .calendar-container .fc-button-active {
                  background-color: #155e75 !important;
                  border-color: #155e75 !important;
                }

                /* Cellules du calendrier */
                .calendar-container .fc-day-today {
                  background-color: #ecfeff !important;
                }

                .calendar-container .fc-daygrid-day-number,
                .calendar-container .fc-col-header-cell-cushion {
                  color: #334155;
                  font-weight: 600;
                  text-decoration: none !important;
                }

                .calendar-container .fc-col-header-cell {
                  background-color: #f8fafc;
                  border-color: #e2e8f0;
                }

                /* Événements */
                .calendar-container .rdv-event {
                  border-radius: 6px !important;
                  padding: 4px 8px !important;
                  font-size: 0.875rem !important;
                  font-weight: 500 !important;
                  cursor: pointer !important;
                  transition: all 0.2s !important;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
                }

                .calendar-container .rdv-event:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
                  filter: brightness(1.05);
                }

                .calendar-container .fc-event-title {
                  font-weight: 600;
                }

                .calendar-container .fc-event-time {
                  font-weight: 500;
                  opacity: 0.9;
                }

                /* Bordures */
                .calendar-container .fc-scrollgrid {
                  border-color: #e2e8f0 !important;
                }

                .calendar-container .fc-daygrid-day {
                  border-color: #f1f5f9 !important;
                }

                /* Vue liste */
                .calendar-container .fc-list-event:hover td {
                  background-color: #f8fafc !important;
                }

                /* Indicateur "maintenant" */
                .calendar-container .fc-timegrid-now-indicator-line {
                  border-color: #0891b2 !important;
                  border-width: 2px !important;
                }
              `}</style>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                locale={frLocale}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                }}
                buttonText={{
                  today: "Aujourd'hui",
                  month: 'Mois',
                  week: 'Semaine',
                  day: 'Jour',
                  list: 'Liste',
                }}
                events={events}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                editable={false}
                selectable={isInfirmier}
                selectMirror={true}
                dayMaxEvents={3}
                weekends={true}
                height="auto"
                eventDisplay="block"
                displayEventTime={true}
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: false,
                }}
                slotMinTime="07:00:00"
                slotMaxTime="19:00:00"
                allDaySlot={false}
                nowIndicator={true}
              />
            </div>
          )}
        </CardContent>
      </Card >

      {/* Dialog de détails du RDV */}
      < Dialog open={!!selectedEvent && !deleteDialogOpen} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-600" />
              Détails du Rendez-vous
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-4">
              {/* Date et Heure */}
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <Clock className="h-5 w-5 text-slate-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500">Date et Heure</p>
                  <p className="text-base font-semibold text-slate-900">
                    {formaterDateRendezVous(selectedEvent.dateHeure)}
                  </p>
                </div>
                <Badge className={STATUT_RDV_COLORS[selectedEvent.statut]}>
                  {STATUT_RDV_LABELS[selectedEvent.statut]}
                </Badge>
              </div>

              {/* Patient */}
              {isInfirmier && (
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <User className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Patient</p>
                    <p className="text-base font-semibold text-slate-900">
                      {getNomCompletPatient(selectedEvent)}
                    </p>
                    <p className="text-sm text-slate-600">{getMatriculePatient(selectedEvent)}</p>
                  </div>
                </div>
              )}

              {/* Infirmier (pour les patients) */}
              {!isInfirmier && (
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <User className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Infirmier</p>
                    <p className="text-base font-semibold text-slate-900">
                      {getNomCompletInfirmier(selectedEvent)}
                    </p>
                  </div>
                </div>
              )}

              {/* Motif */}
              {selectedEvent.motif && (
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Motif</p>
                    <p className="text-base text-slate-900">{selectedEvent.motif}</p>
                  </div>
                </div>
              )}

              {/* Observations */}
              {getObservations(selectedEvent) && (
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <FileText className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Observations</p>
                    <p className="text-base text-slate-900">{getObservations(selectedEvent)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedEvent(null)}
            >
              Fermer
            </Button>
            {isInfirmier && selectedEvent && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/rendez-vous/${selectedEvent.id}/modifier`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Dialog de confirmation de suppression */}
      < Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  );
}
