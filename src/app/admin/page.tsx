'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { Card, Title, BarChart, Metric, Text, AreaChart } from '@tremor/react';

interface ChartData {
  name: string;
  value: number;
}
interface YearChartData {
  year: string;
  count: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalFriends, setTotalFriends] = useState(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [yearChartData, setYearChartData] = useState<YearChartData[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');
      const data = (await res.json()) as {
        totalMembers: number;
        totalFriends: number;
        chartData: ChartData[];
        yearChartData: YearChartData[];
      };
      setTotalMembers(data.totalMembers);
      setTotalFriends(data.totalFriends);
      setChartData(data.chartData);
      setYearChartData(data.yearChartData);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8 px-4 py-4 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <Title className="text-lg font-semibold text-[#4b207f]">Total de miembros</Title>
            <Metric className="mt-2 text-4xl font-bold text-[#4b207f]">
              {loading ? '...' : totalMembers}
            </Metric>
            <Text className="mt-2 text-[#7c7c7c]">Miembros registrados en la iglesia</Text>
          </Card>
          <Card className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <Title className="text-lg font-semibold text-[#e36520]">Total de solicitudes</Title>
            <Metric className="mt-2 text-4xl font-bold text-[#e36520]">
              {loading ? '...' : totalFriends}
            </Metric>
            <Text className="mt-2 text-[#7c7c7c]">Solicitudes de amigos y visitas</Text>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <Title className="mb-4 text-lg font-semibold text-[#4b207f]">
              Miembros por año de bautismo
            </Title>
            <AreaChart
              data={yearChartData}
              index="year"
              categories={['count']}
              colors={['#e36520']}
              className="h-72"
              showLegend={false}
              showGridLines={false}
              valueFormatter={(v) => (v === 0 ? '' : String(v))}
              noDataText="No hay datos aún"
            />
          </Card>
          <Card className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <Title className="mb-4 text-lg font-semibold text-[#4b207f]">
              Solicitudes por tipo
            </Title>
            <BarChart
              data={chartData}
              index="name"
              categories={['value']}
              colors={['#4b207f']}
              yAxisWidth={48}
              className="h-72"
              valueFormatter={(v) => (v === 0 ? '' : String(v))}
              showLegend={false}
              showGridLines={false}
            />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
