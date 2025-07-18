'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import BarChartCustom from '@/app/admin/components/BarChartCustom';
import AreaChartCustom from '@/app/admin/components/AreaChartCustom';

interface ChartData {
  name: string;
  value: number;
}

interface YearChartData {
  year: string;
  count: number;
}

interface AdminDashboardProps {
  adminEmail: string;
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
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
    <AdminLayout adminEmail={adminEmail}>
      <div className="space-y-8 px-4 py-4 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#4b207f]">Total de miembros</h2>
            <div className="mt-2 text-4xl font-bold text-[#4b207f]">
              {loading ? '...' : totalMembers}
            </div>
            <div className="mt-2 text-[#7c7c7c]">Miembros registrados en la iglesia</div>
          </div>
          <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#e36520]">Total de solicitudes</h2>
            <div className="mt-2 text-4xl font-bold text-[#e36520]">
              {loading ? '...' : totalFriends}
            </div>
            <div className="mt-2 text-[#7c7c7c]">Solicitudes de amigos y visitas</div>
          </div>
          <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#4b207f]">Gestión de Anuncios</h2>
            <div className="mt-2 text-sm text-[#7c7c7c]">Administra los anuncios de la iglesia</div>
            <div className="mt-4">
              <a
                href="/admin/announcements"
                className="inline-flex items-center gap-2 rounded-lg bg-[#4b207f] px-4 py-2 text-sm text-white hover:bg-[#4b207f]/90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Gestionar Anuncios
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#4b207f]">
              Miembros por año de bautismo
            </h2>
            <AreaChartCustom data={yearChartData} />
          </div>
          <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#4b207f]">Solicitudes por tipo</h2>
            <BarChartCustom data={chartData} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
