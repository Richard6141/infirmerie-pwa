import { useState } from 'react';
import { BarChart as BarChartIcon, FileText, Syringe, TrendingUp, Users, Calendar, Download, FileSpreadsheet, Activity, PieChart as PieChartIcon, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardStats, useRapportConsultations, useRapportStocks, useRapportVaccinations } from '@/lib/hooks/useRapports';
import { Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  exportDashboardPDF,
  exportConsultationsPDF,
  exportStocksPDF,
  exportVaccinationsPDF,
  exportDashboardExcel,
} from '@/lib/utils/export';
import { toast } from 'sonner';

// Couleurs pour les graphiques
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'];

export function RapportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: dashboardStats, isLoading: loadingDashboard } = useDashboardStats();
  const { data: consultationsStats, isLoading: loadingConsultations } = useRapportConsultations({ startDate, endDate });
  const { data: stocksStats, isLoading: loadingStocks } = useRapportStocks({ startDate, endDate });
  const { data: vaccinationsStats, isLoading: loadingVaccinations } = useRapportVaccinations({ startDate, endDate });

  const handleExportDashboardPDF = () => {
    if (dashboardStats) {
      exportDashboardPDF(dashboardStats);
      toast.success('Rapport Dashboard exporté en PDF');
    }
  };

  const handleExportDashboardExcel = () => {
    if (dashboardStats) {
      exportDashboardExcel(dashboardStats);
      toast.success('Rapport Dashboard exporté en Excel');
    }
  };

  const handleExportConsultationsPDF = () => {
    if (consultationsStats) {
      exportConsultationsPDF(consultationsStats);
      toast.success('Rapport Consultations exporté en PDF');
    }
  };

  const handleExportStocksPDF = () => {
    if (stocksStats) {
      exportStocksPDF(stocksStats);
      toast.success('Rapport Stocks exporté en PDF');
    }
  };

  const handleExportVaccinationsPDF = () => {
    if (vaccinationsStats) {
      exportVaccinationsPDF(vaccinationsStats);
      toast.success('Rapport Vaccinations exporté en PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BarChartIcon className="h-8 w-8 text-purple-600" />
            Rapports & Statistiques
          </h1>
          <p className="text-slate-600 mt-1">
            Analyse complète de l'activité avec graphiques et exports
          </p>
        </div>
      </div>

      {/* Période de rapport */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Période du rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border-purple-200"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border-purple-200"
            />
            <Button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                toast.info('Filtres réinitialisés');
              }}
              variant="outline"
              className="border-purple-300"
            >
              Réinitialiser
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleExportDashboardPDF}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={!dashboardStats}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={handleExportDashboardExcel}
                variant="outline"
                className="flex-1 border-purple-300"
                disabled={!dashboardStats}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour les différents rapports */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
            <Activity className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="consultations" className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="stocks" className="flex items-center gap-2 py-3">
            <Package className="h-4 w-4" />
            Stocks
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="flex items-center gap-2 py-3">
            <Syringe className="h-4 w-4" />
            Vaccinations
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          {loadingDashboard ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            </div>
          ) : dashboardStats ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Total Patients"
                  value={dashboardStats.totalPatients}
                  icon={<Users className="h-6 w-6" />}
                  color="bg-blue-600"
                  trend="+12%"
                />
                <KPICard
                  title="Consultations"
                  value={dashboardStats.consultationsMoisEnCours}
                  icon={<FileText className="h-6 w-6" />}
                  color="bg-emerald-600"
                  subtitle="Ce mois"
                />
                <KPICard
                  title="Vaccinations"
                  value={dashboardStats.vaccinationsMoisEnCours}
                  icon={<Syringe className="h-6 w-6" />}
                  color="bg-orange-600"
                  subtitle="Ce mois"
                />
                <KPICard
                  title="RDV à venir"
                  value={dashboardStats.rendezVousAVenir}
                  icon={<Calendar className="h-6 w-6" />}
                  color="bg-purple-600"
                />
              </div>

              {/* Graphiques principaux */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Évolution des consultations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Évolution des Consultations
                    </CardTitle>
                    <CardDescription>7 derniers jours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={(dashboardStats.consultationsParJour || []).slice(-7)}>
                        <defs>
                          <linearGradient id="colorConsultations" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                          formatter={(value: any) => [value, 'Consultations']}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorConsultations)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top motifs - Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-blue-600" />
                      Top Motifs de Consultation
                    </CardTitle>
                    <CardDescription>Répartition par motif</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={(dashboardStats.topMotifsConsultations || []).slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ motif, percent }) => `${motif}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="motif"
                        >
                          {(dashboardStats.topMotifsConsultations || []).slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Patients par direction */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Répartition des Patients par Direction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboardStats.repartitionPatientsParDirection || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="direction" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8b5cf6" name="Nombre de patients" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <EmptyState message="Aucune donnée disponible pour le dashboard" />
          )}
        </TabsContent>

        {/* TAB 2: CONSULTATIONS */}
        <TabsContent value="consultations" className="space-y-6">
          {loadingConsultations ? (
            <LoadingState />
          ) : consultationsStats ? (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Rapport Consultations</h2>
                  {consultationsStats.periode && (
                    <p className="text-sm text-slate-600 mt-1">
                      Période: {new Date(consultationsStats.periode.debut).toLocaleDateString('fr-FR')} - {new Date(consultationsStats.periode.fin).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <Button onClick={handleExportConsultationsPDF} className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>

              {/* KPIs Consultations */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total" value={consultationsStats.totalConsultations} color="bg-emerald-100 text-emerald-800" />
                <StatCard title="Terminées" value={consultationsStats.consultationsParStatut?.terminees || 0} color="bg-green-100 text-green-800" />
                <StatCard title="En cours" value={consultationsStats.consultationsParStatut?.enCours || 0} color="bg-blue-100 text-blue-800" />
                <StatCard title="Annulées" value={consultationsStats.consultationsParStatut?.annulees || 0} color="bg-red-100 text-red-800" />
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Évolution */}
                {consultationsStats.consultationsParJour && consultationsStats.consultationsParJour.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution sur la période</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={consultationsStats.consultationsParJour || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          />
                          <YAxis />
                          <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')} />
                          <Legend />
                          <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Consultations" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Top Motifs */}
                {consultationsStats.topMotifs && consultationsStats.topMotifs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Motifs Principaux</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={(consultationsStats.topMotifs || []).slice(0, 8)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="motif" type="category" width={150} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Top Infirmiers */}
              {consultationsStats.topInfirmiers && consultationsStats.topInfirmiers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Infirmiers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={consultationsStats.topInfirmiers}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nom" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" name="Nombre de consultations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <EmptyState message="Aucune donnée de consultation disponible pour la période sélectionnée" />
          )}
        </TabsContent>

        {/* TAB 3: STOCKS */}
        <TabsContent value="stocks" className="space-y-6">
          {loadingStocks ? (
            <LoadingState />
          ) : stocksStats ? (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Rapport Stocks</h2>
                  {stocksStats.periode && (
                    <p className="text-sm text-slate-600 mt-1">
                      Période: {new Date(stocksStats.periode.debut).toLocaleDateString('fr-FR')} - {new Date(stocksStats.periode.fin).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <Button onClick={handleExportStocksPDF} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>

              {/* Alertes urgentes */}
              {stocksStats.alertesRuptures && stocksStats.alertesRuptures.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Alertes de Rupture ({stocksStats.alertesRuptures?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(stocksStats.alertesRuptures || []).slice(0, 6).map((alerte, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border border-red-200">
                          <p className="font-semibold text-slate-800">{alerte.nomCommercial}</p>
                          <p className="text-xs text-slate-600 mt-1">{alerte.code} - {alerte.dci}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm text-slate-600">Stock:</span>
                            <span className="text-lg font-bold text-red-600">{alerte.quantiteActuelle}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm text-slate-600">Seuil:</span>
                            <span className="text-sm text-slate-600">{alerte.seuilMin}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mouvements */}
              {stocksStats.mouvementsPeriode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    title="Entrées"
                    value={stocksStats.mouvementsPeriode.entrees}
                    color="bg-green-100 text-green-800"
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                  <StatCard
                    title="Sorties"
                    value={stocksStats.mouvementsPeriode.sorties}
                    color="bg-red-100 text-red-800"
                    icon={<TrendingUp className="h-5 w-5 rotate-180" />}
                  />
                  <StatCard
                    title="Total Mouvements"
                    value={stocksStats.mouvementsPeriode.total}
                    color="bg-blue-100 text-blue-800"
                  />
                </div>
              )}

              {/* Médicaments les plus consommés */}
              {stocksStats.medicamentsPlusConsommes && stocksStats.medicamentsPlusConsommes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Médicaments les Plus Consommés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={(stocksStats.medicamentsPlusConsommes || []).slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nomCommercial" angle={-45} textAnchor="end" height={120} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantiteConsommee" fill="#3b82f6" name="Quantité consommée" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <EmptyState message="Aucune donnée de stock disponible pour la période sélectionnée" />
          )}
        </TabsContent>

        {/* TAB 4: VACCINATIONS */}
        <TabsContent value="vaccinations" className="space-y-6">
          {loadingVaccinations ? (
            <LoadingState />
          ) : vaccinationsStats ? (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Rapport Vaccinations</h2>
                  {vaccinationsStats.periode && (
                    <p className="text-sm text-slate-600 mt-1">
                      Période: {new Date(vaccinationsStats.periode.debut).toLocaleDateString('fr-FR')} - {new Date(vaccinationsStats.periode.fin).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <Button onClick={handleExportVaccinationsPDF} className="bg-orange-600 hover:bg-orange-700">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Vaccinations" value={vaccinationsStats.totalVaccinations} color="bg-orange-100 text-orange-800" />
                <StatCard
                  title="Taux de Couverture"
                  value={`${vaccinationsStats.couvertureVaccinale?.pourcentage.toFixed(1) || 0}%`}
                  color="bg-green-100 text-green-800"
                />
                <StatCard
                  title="Rappels à Venir"
                  value={vaccinationsStats.rappelsAVenir?.length || 0}
                  color="bg-blue-100 text-blue-800"
                />
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Répartition par type */}
                {vaccinationsStats.statistiquesParType && vaccinationsStats.statistiquesParType.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par Type de Vaccin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={vaccinationsStats.statistiquesParType || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ typeVaccin, pourcentage }) => `${typeVaccin}: ${pourcentage.toFixed(1)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="typeVaccin"
                          >
                            {(vaccinationsStats.statistiquesParType || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Détails par type */}
                {vaccinationsStats.statistiquesParType && vaccinationsStats.statistiquesParType.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Détails par Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={vaccinationsStats.statistiquesParType || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="typeVaccin" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f59e0b" name="Nombre" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Couverture vaccinale */}
              {vaccinationsStats.couvertureVaccinale && (
                <Card>
                  <CardHeader>
                    <CardTitle>Couverture Vaccinale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Personnes éligibles:</span>
                        <span className="text-2xl font-bold text-slate-800">{vaccinationsStats.couvertureVaccinale.eligible}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Personnes vaccinées:</span>
                        <span className="text-2xl font-bold text-green-600">{vaccinationsStats.couvertureVaccinale.vaccines}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div
                          className="bg-green-600 h-4 rounded-full transition-all"
                          style={{ width: `${vaccinationsStats.couvertureVaccinale.pourcentage}%` }}
                        />
                      </div>
                      <p className="text-center text-sm text-slate-600">
                        Taux de couverture: <span className="font-bold text-green-600">{vaccinationsStats.couvertureVaccinale.pourcentage.toFixed(1)}%</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rappels à venir */}
              {vaccinationsStats.rappelsAVenir && vaccinationsStats.rappelsAVenir.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rappels à Venir ({vaccinationsStats.rappelsAVenir?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(vaccinationsStats.rappelsAVenir || []).map((rappel, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            rappel.statut === 'URGENT' ? 'bg-red-50 border-red-200' :
                            rappel.statut === 'PROCHE' ? 'bg-orange-50 border-orange-200' :
                            'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-800">{rappel.nomPatient}</p>
                              <p className="text-sm text-slate-600">{rappel.typeVaccin}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-800">
                                {new Date(rappel.dateRappel).toLocaleDateString('fr-FR')}
                              </p>
                              <span className={`text-xs font-semibold ${
                                rappel.statut === 'URGENT' ? 'text-red-600' :
                                rappel.statut === 'PROCHE' ? 'text-orange-600' :
                                'text-blue-600'
                              }`}>
                                {rappel.statut}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <EmptyState message="Aucune donnée de vaccination disponible pour la période sélectionnée" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composants utilitaires
interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  subtitle?: string;
}

function KPICard({ title, value, icon, color, trend, subtitle }: KPICardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-600 mb-1">{title}</p>
            {subtitle && <p className="text-xs text-slate-500 mb-2">{subtitle}</p>}
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            {trend && (
              <p className="text-sm text-green-600 font-medium mt-1">{trend}</p>
            )}
          </div>
          <div className={`h-14 w-14 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  color: string;
  icon?: React.ReactNode;
}

function StatCard({ title, value, color, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-600">Chargement des données...</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-20">
        <div className="text-center">
          <BarChartIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">{message}</p>
          <p className="text-sm text-slate-500 mt-2">
            Sélectionnez une période ou modifiez les filtres pour afficher les données
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
