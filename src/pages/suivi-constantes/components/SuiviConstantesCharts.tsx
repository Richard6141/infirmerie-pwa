import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Activity } from 'lucide-react';
import type { EvolutionData } from '@/types/suivi-constantes';

interface SuiviConstantesChartsProps {
    evolution: EvolutionData;
}

export function SuiviConstantesCharts({ evolution }: SuiviConstantesChartsProps) {
    // Vérification défensive
    if (!evolution || !evolution.dates || !Array.isArray(evolution.dates)) {
        return (
            <div className="text-center py-12 text-slate-500 mb-6">
                <p>Données d'évolution indisponibles</p>
                <div className="mt-4 text-xs text-left bg-slate-100 p-4 rounded border overflow-auto max-h-60">
                    <p className="font-bold mb-2">Debug API Response:</p>
                    <pre>{JSON.stringify(evolution, null, 2)}</pre>
                </div>
            </div>
        );
    }

    // Préparer les données pour les graphiques
    const chartData = evolution.dates.map((date, index) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        tensionSystolique: evolution.tensionSystolique[index],
        tensionDiastolique: evolution.tensionDiastolique[index],
        frequenceCardiaque: evolution.frequenceCardiaque[index],
        temperature: evolution.temperature[index],
        saturationOxygene: evolution.saturationOxygene[index],
        glycemie: evolution.glycemie[index],
        poids: evolution.poids[index],
        imc: evolution.imc[index],
    }));

    if (chartData.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-slate-100 mb-6">
                <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">Pas assez de données</p>
                <p className="text-sm mt-1">
                    L'évolution s'affichera dès que plusieurs prises seront enregistrées.
                </p>
            </div>
        );
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Évolution des constantes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="tension" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="tension">Tension</TabsTrigger>
                        <TabsTrigger value="glycemie">Glycémie</TabsTrigger>
                        <TabsTrigger value="imc">IMC</TabsTrigger>
                        <TabsTrigger value="autres">Autres</TabsTrigger>
                    </TabsList>

                    {/* Graphique Tension */}
                    <TabsContent value="tension" className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="3 3" label="Normal systolique" />
                                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" label="Normal diastolique" />
                                <Line
                                    type="monotone"
                                    dataKey="tensionSystolique"
                                    stroke="#ef4444"
                                    name="Systolique (mmHg)"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="tensionDiastolique"
                                    stroke="#3b82f6"
                                    name="Diastolique (mmHg)"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        {evolution.statistiques.tensionSystolique && (
                            <div className="grid grid-cols-3 gap-4 text-sm bg-slate-50 p-3 rounded-md">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Minimum</p>
                                    <p className="font-semibold text-slate-700">
                                        {evolution.statistiques.tensionSystolique.min}/
                                        {evolution.statistiques.tensionDiastolique?.min} <span className="text-xs text-slate-500">mmHg</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Moyenne</p>
                                    <p className="font-semibold text-slate-700">
                                        {evolution.statistiques.tensionSystolique.moyenne.toFixed(0)}/
                                        {evolution.statistiques.tensionDiastolique?.moyenne.toFixed(0)} <span className="text-xs text-slate-500">mmHg</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Maximum</p>
                                    <p className="font-semibold text-slate-700">
                                        {evolution.statistiques.tensionSystolique.max}/
                                        {evolution.statistiques.tensionDiastolique?.max} <span className="text-xs text-slate-500">mmHg</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Graphique Glycémie */}
                    <TabsContent value="glycemie" className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine y={0.8} stroke="#22c55e" strokeDasharray="3 3" label="Min normal" />
                                <ReferenceLine y={1.2} stroke="#22c55e" strokeDasharray="3 3" label="Max normal" />
                                <Line
                                    type="monotone"
                                    dataKey="glycemie"
                                    stroke="#8b5cf6"
                                    name="Glycémie (g/L)"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        {evolution.statistiques.glycemie && (
                            <div className="grid grid-cols-3 gap-4 text-sm bg-slate-50 p-3 rounded-md">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Minimum</p>
                                    <p className="font-semibold text-slate-700">{evolution.statistiques.glycemie.min} <span className="text-xs text-slate-500">g/L</span></p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Moyenne</p>
                                    <p className="font-semibold text-slate-700">
                                        {evolution.statistiques.glycemie.moyenne.toFixed(2)} <span className="text-xs text-slate-500">g/L</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Maximum</p>
                                    <p className="font-semibold text-slate-700">{evolution.statistiques.glycemie.max} <span className="text-xs text-slate-500">g/L</span></p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Graphique IMC */}
                    <TabsContent value="imc" className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine y={18.5} stroke="#f59e0b" strokeDasharray="3 3" label="Maigreur" />
                                <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="3 3" label="Normal" />
                                <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="3 3" label="Surpoids" />
                                <Line
                                    type="monotone"
                                    dataKey="imc"
                                    stroke="#10b981"
                                    name="IMC"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="poids"
                                    stroke="#6366f1"
                                    name="Poids (kg)"
                                    strokeWidth={2}
                                    yAxisId="right"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        {evolution.statistiques.imc && (
                            <div className="grid grid-cols-3 gap-4 text-sm bg-slate-50 p-3 rounded-md">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Minimum</p>
                                    <p className="font-semibold text-slate-700">{evolution.statistiques.imc.min}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Moyenne</p>
                                    <p className="font-semibold text-slate-700">
                                        {evolution.statistiques.imc.moyenne.toFixed(1)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Maximum</p>
                                    <p className="font-semibold text-slate-700">{evolution.statistiques.imc.max}</p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Autres constantes */}
                    <TabsContent value="autres" className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="frequenceCardiaque"
                                    stroke="#f97316"
                                    name="FC (bpm)"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="temperature"
                                    stroke="#ec4899"
                                    name="Temp (°C)"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="saturationOxygene"
                                    stroke="#06b6d4"
                                    name="SpO₂ (%)"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
