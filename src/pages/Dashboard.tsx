import { useAuth } from '@/lib/hooks/useAuth';
import { useRendezVousToday } from '@/lib/hooks/useRendezVous';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncStatus } from '@/components/sync/SyncStatus';
import { SyncButton } from '@/components/sync/SyncButton';
import { OfflineBannerCompact } from '@/components/sync/OfflineBanner';
import { StockAlertsWidget } from '@/components/stocks';
import { RappelsVaccinsWidget } from '@/components/vaccinations';
import { syncService } from '@/lib/sync/syncService';
import { toast } from 'sonner';
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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon, gradient, trend }: StatCardProps) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 border-0 bg-white overflow-hidden group hover-lift">
      <div className={`h-1 ${gradient}`}></div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
          </div>
          <div className={`stat-icon-wrapper ${gradient.replace('bg-gradient-to-r', 'bg-gradient-to-br')} shadow-sm`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <div className={cn(
              "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold",
              trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{trend.value}</span>
            </div>
            <span className="text-xs text-slate-500">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ModuleCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  count?: number;
  gradient: string;
}

function ModuleCard({ to, icon, title, count, gradient }: ModuleCardProps) {
  return (
    <Link to={to} className="group">
      <Card className="cursor-pointer transition-all duration-300 h-full border border-slate-200 shadow-card hover:shadow-card-hover hover:-translate-y-1 bg-white">
        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center gap-3">
            {/* Circular gradient icon */}
            <div className={`h-16 w-16 rounded-2xl ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
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

function WelcomeBanner({ userName, rdvCount = 0 }: WelcomeBannerProps) {
  const currentTime = new Date().getHours();
  const greeting = currentTime < 12 ? 'Bonjour' : currentTime < 18 ? 'Bon après-midi' : 'Bonsoir';
  
  return (
    <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 shadow-xl">
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
              {greeting}, Dr {userName}
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
                <p className="text-2xl font-bold text-white leading-none">0</p>
                <p className="text-xs text-blue-100 mt-1">Nouveaux</p>
              </div>
            </div>

            {/* Consultations */}
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 shadow-lg min-w-[140px]">
              <div className="p-2.5 bg-white/20 rounded-lg">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">0</p>
                <p className="text-xs text-blue-100 mt-1">Opérations</p>
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

  // Handle sync
  const handleSync = async () => {
    try {
      await syncService.downloadAllData();
      toast.success('Données synchronisées avec succès');
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la synchronisation');
    }
  };

  // Dashboard pour l'Infirmier (Gestionnaire)
  if (isInfirmier) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Bannière de bienvenue */}
        <WelcomeBanner userName={`${user?.prenom} ${user?.nom}`} rdvCount={rendezVousToday?.length || 0} />

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
            <div className="text-xs text-slate-500">Mis à jour il y a quelques secondes</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Nouveaux Patients"
              value="0"
              icon={<Users className="h-6 w-6" />}
              gradient="bg-gradient-to-r from-success to-emerald-600"
              trend={{ value: "+12%", isPositive: true }}
            />
            <StatCard
              title="Consultations"
              value="0"
              icon={<FileText className="h-6 w-6" />}
              gradient="bg-gradient-to-r from-primary to-blue-600"
              trend={{ value: "+8%", isPositive: true }}
            />
            <StatCard
              title="Tests Laboratoire"
              value="0"
              icon={<Activity className="h-6 w-6" />}
              gradient="bg-gradient-to-r from-destructive to-rose-600"
              trend={{ value: "+15%", isPositive: true }}
            />
            <StatCard
              title="Revenus Total"
              value="0 FCFA"
              icon={<DollarSign className="h-6 w-6" />}
              gradient="bg-gradient-to-r from-warning to-amber-600"
              trend={{ value: "+22%", isPositive: true }}
            />
          </div>
        </div>

        {/* Modules Services */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Services Médicaux</h2>
            <Link to="/rapports" className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1">
              Voir tout
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <ModuleCard
              to="/patients"
              icon={<Users className="h-7 w-7" />}
              title="Patients"
              count={0}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <ModuleCard
              to="/consultations"
              icon={<FileText className="h-7 w-7" />}
              title="Consultations"
              count={0}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <ModuleCard
              to="/medicaments"
              icon={<Pill className="h-7 w-7" />}
              title="Médicaments"
              count={0}
              gradient="bg-gradient-to-br from-pink-500 to-pink-600"
            />
            <ModuleCard
              to="/stocks"
              icon={<Package className="h-7 w-7" />}
              title="Stocks"
              count={0}
              gradient="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <ModuleCard
              to="/vaccinations"
              icon={<Syringe className="h-7 w-7" />}
              title="Vaccinations"
              count={0}
              gradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <ModuleCard
              to="/rendez-vous"
              icon={<Calendar className="h-7 w-7" />}
              title="Rendez-vous"
              count={0}
              gradient="bg-gradient-to-br from-cyan-500 to-cyan-600"
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
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <ModuleCard
            to="/vaccinations"
            icon={<Syringe className="h-7 w-7" />}
            title="Mes Vaccinations"
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <ModuleCard
            to="/rendez-vous"
            icon={<Calendar className="h-7 w-7" />}
            title="Mes Rendez-vous"
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>
      </div>

      {/* Informations personnelles */}
      <Card className="border-l-4 border-l-primary shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">Informations Personnelles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Email</p>
                <p className="text-sm font-semibold text-slate-800">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2.5 bg-success/10 rounded-lg">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Statut</p>
                <p className="text-sm font-semibold text-slate-800">Personnel du Ministère</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}