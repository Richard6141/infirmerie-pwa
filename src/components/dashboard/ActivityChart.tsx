import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';

interface ActivityChartProps {
  title: string;
  data: Array<{ name: string; consultations?: number; vaccinations?: number; }>;
}

export function ActivityChart({ title, data }: ActivityChartProps) {
  return (
    <Card className="shadow-card border-slate-200">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
          <Activity className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="consultations"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Consultations"
            />
            <Line
              type="monotone"
              dataKey="vaccinations"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Vaccinations"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
