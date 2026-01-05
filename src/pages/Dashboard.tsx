import { useAuth } from '@/lib/hooks/useAuth';
import { useRendezVousToday } from '@/lib/hooks/useRendezVous';
import { useDashboardStats as useDashboardStatsOld } from '@/lib/hooks/useDashboardStats';
import { useDashboardStats } from '@/lib/hooks/useRapports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncStatus } from '@/components/sync/SyncStatus';
import { SyncButton } from '@/components/sync/SyncButton';
import { OfflineBannerCompact } from '@/components/sync/OfflineBanner';
import { StockAlertsWidget } from '@/components/stocks';
import { RappelsVaccinsWidget } from '@/components/vaccinations';
import { StatsChart, ActivityChart } from '@/components/dashboard';
import { syncService } from '@/lib/sync/syncService';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  Pill,
  Package,
  Syringe,
  Calendar,
  Activity,
  UserCheck,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SuiviConstantesCharts } from '@/pages/suivi-constantes/components/SuiviConstantesCharts';
import { useEvolutionConstantes } from '@/lib/hooks/useSuiviConstantes';
import { useMyPatientProfile } from '@/lib/hooks/usePatients';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, color, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-card border-slate-200">
        <div className={`h-1 ${color}`}></div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 border-slate-200 bg-white overflow-hidden group hover-lift">
      <div className={`h-1 ${color}`}></div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
          </div>
          <div className={`stat-icon-wrapper ${color} shadow-sm`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ModuleCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  count?: number;
  color: string;
}

function ModuleCard({ to, icon, title, count, color }: ModuleCardProps) {
  return (
    <Link to={to} className="group">
      <Card className="cursor-pointer transition-all duration-300 h-full border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-1 bg-white">
        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center gap-3">
            {/* Circular solid color icon */}
            <div className={`h-16 w-16 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
              <div className="text-white">
                {icon}
              </div>
            </div>

            {/* Title and Count */}
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{title}</CardTitle>
              {count !== undefined && (
                <div className="text-2xl font-bold text-slate-800">{count}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface WelcomeBannerProps {
  userName: string;
  rdvCount?: number;
}

function WelcomeBanner({ userName, rdvCount = 0, nouveauxPatients = 0, consultationsJour = 0 }: WelcomeBannerProps & { nouveauxPatients?: number, consultationsJour?: number }) {
  const currentTime = new Date().getHours();
  const greeting = currentTime < 12 ? 'Bonjour' : currentTime < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-6 shadow-xl">
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-3">
              <Clock className="h-3 w-3 text-white" />
              <span className="text-xs font-medium text-white">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {greeting}, {userName}
            </h1>
            <p className="text-blue-100 text-sm">Voici un aperçu de votre planning aujourd'hui</p>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-3">
            {/* Appointments */}
            <Link to="/rendez-vous" className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 shadow-lg min-w-[140px] hover:bg-white/20 transition-colors">
              <div className="p-2.5 bg-white/20 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{rdvCount}</p>
                <p className="text-xs text-blue-100 mt-1">RDV aujourd'hui</p>
              </div>
            </Link>

            {/* New Patients */}
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 shadow-lg min-w-[140px]">
              <div className="p-2.5 bg-white/20 rounded-lg">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{nouveauxPatients}</p>
                <p className="text-xs text-blue-100 mt-1">Nouveaux</p>
              </div>
            </div>

            {/* Consultations */}
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 shadow-lg min-w-[140px]">
              <div className="p-2.5 bg-white/20 rounded-lg">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{consultationsJour}</p>
                <p className="text-xs text-blue-100 mt-1">Consultations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-3xl"></div>
      <div className="absolute right-20 -bottom-16 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
      <div className="absolute left-1/3 -bottom-8 h-40 w-40 rounded-full bg-white/5 blur-3xl"></div>
    </div>
  );
}

export function DashboardPage() {
  const { user, isInfirmier } = useAuth();
  const { data: rendezVousToday } = useRendezVousToday();
  const { data: stats, isLoading: statsLoading } = useDashboardStatsOld();

  // Handle sync
  const handleSync = async () => {
    try {
      await syncService.downloadAllData();
      toast.success('Données synchronisées avec succès');
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la synchronisation');
    }
  };

  // Récupérer les statistiques du rapport dashboard pour les données d'activité
  const { data: dashboardStats } = useDashboardStats();

  // Données pour le Patient (Graphiques)
  const { data: myPatient } = useMyPatientProfile();
  const { data: evolution } = useEvolutionConstantes(myPatient?.id);

  // Données pour les graphiques
  const servicesData = stats ? [
    { name: 'Patients', value: stats.patients.total },
    { name: 'Consultations', value: stats.consultations.total },
    { name: 'Médicaments', value: stats.medicaments.total },
    { name: 'Vaccinations', value: stats.vaccinations.total },
  ] : [];

  // Données réelles pour l'activité mensuelle sur 6 mois
  const activityData = dashboardStats?.activiteSurSixMois || [];

  // Dashboard pour l'Infirmier (Gestionnaire)
  if (isInfirmier) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Bannière de bienvenue */}
        <WelcomeBanner
          userName={`${user?.prenom} ${user?.nom}`}
          rdvCount={stats?.rendezVous.ceJour || 0}
          nouveauxPatients={stats?.patients.nouveaux || 0}
          consultationsJour={stats?.consultations.ceJour || 0}
        />

        {/* Indicateur offline */}
        <OfflineBannerCompact />

        {/* Synchronisation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SyncStatus />
          </div>
          <div className="flex items-center justify-center lg:justify-end">
            <SyncButton onSync={handleSync} size="lg" className="w-full lg:w-auto" />
          </div>
        </div>

        {/* Statistiques clés */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Vue d'ensemble</h2>
            {!statsLoading && <div className="text-xs text-slate-500">Mis à jour il y a quelques secondes</div>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Patients"
              value={stats?.patients.total || 0}
              icon={<Users className="h-6 w-6" />}
              color="bg-blue-600"
              isLoading={statsLoading}
            />
            <StatCard
              title="Consultations"
              value={stats?.consultations.total || 0}
              icon={<FileText className="h-6 w-6" />}
              color="bg-green-600"
              isLoading={statsLoading}
            />
            <StatCard
              title="Vaccinations"
              value={stats?.vaccinations.total || 0}
              icon={<Syringe className="h-6 w-6" />}
              color="bg-purple-600"
              isLoading={statsLoading}
            />
            <StatCard
              title="Alertes Stocks"
              value={stats?.stocks.alertes || 0}
              icon={<Package className="h-6 w-6" />}
              color="bg-orange-600"
              isLoading={statsLoading}
            />
          </div>
        </div>

        {/* Graphiques d'activité */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityChart title="Activité sur 6 mois" data={activityData} />
          <StatsChart title="Répartition des services" data={servicesData} type="pie" />
        </div>

        {/* Modules Services */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Services Médicaux</h2>
            <Link to="/rapports" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Voir tout
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <ModuleCard
              to="/patients"
              icon={<Users className="h-7 w-7" />}
              title="Patients"
              count={stats?.patients.total || 0}
              color="bg-blue-600"
            />
            <ModuleCard
              to="/consultations"
              icon={<FileText className="h-7 w-7" />}
              title="Consultations"
              count={stats?.consultations.total || 0}
              color="bg-purple-600"
            />
            <ModuleCard
              to="/medicaments"
              icon={<Pill className="h-7 w-7" />}
              title="Médicaments"
              count={stats?.medicaments.total || 0}
              color="bg-pink-600"
            />
            <ModuleCard
              to="/stocks"
              icon={<Package className="h-7 w-7" />}
              title="Stocks"
              count={stats?.stocks.total || 0}
              color="bg-orange-600"
            />
            <ModuleCard
              to="/vaccinations"
              icon={<Syringe className="h-7 w-7" />}
              title="Vaccinations"
              count={stats?.vaccinations.total || 0}
              color="bg-green-600"
            />
            <ModuleCard
              to="/rendez-vous"
              icon={<Calendar className="h-7 w-7" />}
              title="Rendez-vous"
              count={stats?.rendezVous.total || 0}
              color="bg-cyan-600"
            />
          </div>
        </div>

        {/* Alertes et Rappels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockAlertsWidget />
          <RappelsVaccinsWidget />
        </div>
      </div>
    );
  }

  // Dashboard pour le Personnel (Patient)
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bannière de bienvenue */}
      <WelcomeBanner userName={`${user?.prenom} ${user?.nom}`} rdvCount={0} />

      {/* Modules patient */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Mes Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <ModuleCard
            to="/consultations"
            icon={<FileText className="h-7 w-7" />}
            title="Mes Consultations"
            color="bg-blue-600"
          />
          <ModuleCard
            to="/vaccinations"
            icon={<Syringe className="h-7 w-7" />}
            title="Mes Vaccinations"
            color="bg-green-600"
          />
          <ModuleCard
            to="/rendez-vous"
            icon={<Calendar className="h-7 w-7" />}
            title="Mes Rendez-vous"
            color="bg-purple-600"
          />
        </div>
      </div>

      {/* Graphiques d'évolution des constantes (au lieu des infos persos) */}
      {evolution ? (
        <SuiviConstantesCharts evolution={evolution} />
      ) : (
        <Card className="border-l-4 border-l-blue-600 shadow-card">
          <CardContent className="p-8 text-center text-slate-500">
            <Activity className="h-8 w-8 mx-auto mb-2 text-slate-300 animate-pulse" />
            <p>Chargement de vos données de santé...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}