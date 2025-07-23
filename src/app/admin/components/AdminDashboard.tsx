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

interface BirthdayData {
  name: string;
  birthDate: string;
  type: 'member' | 'child';
}

interface AgeRangeData {
  name: string;
  value: number;
}

interface AdminDashboardProps {
  adminEmail: string;
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalFriends, setTotalFriends] = useState(0);
  const [totalChildren, setTotalChildren] = useState(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [yearChartData, setYearChartData] = useState<YearChartData[]>([]);
  const [currentQuarterBirthdays, setCurrentQuarterBirthdays] = useState<{
    memberBirthdays: BirthdayData[];
    childBirthdays: BirthdayData[];
  }>({ memberBirthdays: [], childBirthdays: [] });
  const [previousQuarterBirthdays, setPreviousQuarterBirthdays] = useState<{
    memberBirthdays: BirthdayData[];
    childBirthdays: BirthdayData[];
  }>({ memberBirthdays: [], childBirthdays: [] });
  const [selectedQuarter, setSelectedQuarter] = useState<'current' | 'previous'>('current');
  const [memberGenderDistribution, setMemberGenderDistribution] = useState<ChartData[]>([]);
  const [childGenderDistribution, setChildGenderDistribution] = useState<ChartData[]>([]);
  const [memberAgeRanges, setMemberAgeRanges] = useState<AgeRangeData[]>([]);
  const [childAgeRanges, setChildAgeRanges] = useState<AgeRangeData[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');
      const data = (await res.json()) as {
        totalMembers: number;
        totalFriends: number;
        totalChildren: number;
        chartData: ChartData[];
        yearChartData: YearChartData[];
        currentQuarterBirthdays: {
          memberBirthdays: BirthdayData[];
          childBirthdays: BirthdayData[];
        };
        previousQuarterBirthdays: {
          memberBirthdays: BirthdayData[];
          childBirthdays: BirthdayData[];
        };
        memberGenderDistribution: Record<string, number>;
        childGenderDistribution: Record<string, number>;
        memberAgeRanges: Record<string, number>;
        childAgeRanges: Record<string, number>;
      };

      setTotalMembers(data.totalMembers);
      setTotalFriends(data.totalFriends);
      setTotalChildren(data.totalChildren);
      setChartData(data.chartData);
      setYearChartData(data.yearChartData);
      setCurrentQuarterBirthdays(data.currentQuarterBirthdays);
      setPreviousQuarterBirthdays(data.previousQuarterBirthdays);

      // Convert member gender distribution to chart format
      const memberGenderChartData = Object.entries(data.memberGenderDistribution).map(
        ([gender, count]) => ({
          name: gender,
          value: count,
        })
      );
      setMemberGenderDistribution(memberGenderChartData);

      // Convert child gender distribution to chart format
      const childGenderChartData = Object.entries(data.childGenderDistribution).map(
        ([gender, count]) => ({
          name: gender,
          value: count,
        })
      );
      setChildGenderDistribution(childGenderChartData);

      // Convert age ranges to chart format
      const memberAgeChartData = Object.entries(data.memberAgeRanges).map(([range, count]) => ({
        name: range,
        value: count,
      }));
      setMemberAgeRanges(memberAgeChartData);

      const childAgeChartData = Object.entries(data.childAgeRanges).map(([range, count]) => ({
        name: range,
        value: count,
      }));
      setChildAgeRanges(childAgeChartData);

      setLoading(false);
    }
    fetchData();
  }, []);

  const formatBirthday = (birthDate: string) => {
    // Extract day and month directly from the date string to avoid timezone issues
    const [year, month, day] = birthDate.split('T')[0].split('-').map(Number);
    const monthNames = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    return `${day} de ${monthNames[month - 1]}`;
  };

  const getSelectedQuarterBirthdays = () => {
    return selectedQuarter === 'current' ? currentQuarterBirthdays : previousQuarterBirthdays;
  };

  const getQuarterLabel = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    if (selectedQuarter === 'current') {
      const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
      const quarterEndMonth = currentQuarter * 3;
      const startMonthName = monthNames[quarterStartMonth - 1];
      const endMonthName = monthNames[quarterEndMonth - 1];
      return `Trimestre ${currentQuarter} (Actual) - ${startMonthName} a ${endMonthName}`;
    } else {
      const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
      const previousQuarterStartMonth = (previousQuarter - 1) * 3 + 1;
      const previousQuarterEndMonth = previousQuarter * 3;
      const startMonthName = monthNames[previousQuarterStartMonth - 1];
      const endMonthName = monthNames[previousQuarterEndMonth - 1];
      return `Trimestre ${previousQuarter} (Anterior) - ${startMonthName} a ${endMonthName}`;
    }
  };

  const downloadBirthdaysCSV = (birthdays: BirthdayData[], type: 'members' | 'children') => {
    if (birthdays.length === 0) {
      alert('No hay datos para descargar');
      return;
    }

    const quarterLabel = getQuarterLabel();
    const fileName = `cumpleaños_${type}_${quarterLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

    // Create CSV content
    const csvContent = [
      ['Nombre', 'Día', 'Mes'],
      ...birthdays.map((birthday) => {
        // Extract day and month directly from the date string to avoid timezone issues
        const [year, month, day] = birthday.birthDate.split('T')[0].split('-').map(Number);
        const monthNames = [
          'enero',
          'febrero',
          'marzo',
          'abril',
          'mayo',
          'junio',
          'julio',
          'agosto',
          'septiembre',
          'octubre',
          'noviembre',
          'diciembre',
        ];
        return [birthday.name, day.toString(), monthNames[month - 1]];
      }),
    ]
      .map((row) => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="space-y-8 px-4 py-4 md:px-8">
        {/* SECCIÓN 1: SOLICITUDES */}
        <div>
          <h1 className="mb-6 text-2xl font-bold text-[#4b207f]">Solicitudes</h1>

          {/* Stats Cards - Solicitudes */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-1">
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#e36520]">Total de solicitudes</h2>
              <div className="mt-2 text-4xl font-bold text-[#e36520]">
                {loading ? '...' : totalFriends}
              </div>
              <div className="mt-2 text-[#7c7c7c]">Solicitudes nuevas (sin leer)</div>
            </div>
          </div>

          {/* Charts - Solicitudes */}
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-1">
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#4b207f]">Solicitudes por tipo</h2>
              <BarChartCustom data={chartData} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: MIEMBROS */}
        <div>
          <h1 className="mb-6 text-2xl font-bold text-[#4b207f]">Miembros</h1>

          {/* Stats Cards - Miembros */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-1">
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#4b207f]">Total de miembros</h2>
              <div className="mt-2 text-4xl font-bold text-[#4b207f]">
                {loading ? '...' : totalMembers}
              </div>
              <div className="mt-2 text-[#7c7c7c]">Miembros registrados en la iglesia</div>
            </div>
          </div>

          {/* Charts - Miembros */}
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#4b207f]">
                Miembros por año de bautismo
              </h2>
              <AreaChartCustom data={yearChartData} />
            </div>
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#4b207f]">
                Miembros por edad actual
              </h2>
              <BarChartCustom data={memberAgeRanges} />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-1">
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#4b207f]">Distribución por género</h2>
              <BarChartCustom data={memberGenderDistribution} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: NIÑOS */}
        <div>
          <h1 className="mb-6 text-2xl font-bold text-[#4b207f]">Niños</h1>

          {/* Stats Cards - Niños */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-1">
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#28a745]">Total de niños</h2>
              <div className="mt-2 text-4xl font-bold text-[#28a745]">
                {loading ? '...' : totalChildren}
              </div>
              <div className="mt-2 text-[#7c7c7c]">Niños registrados</div>
            </div>
          </div>

          {/* Charts - Niños */}
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#4b207f]">Niños por edad</h2>
              <BarChartCustom data={childAgeRanges} />
            </div>
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#4b207f]">Distribución por género</h2>
              <BarChartCustom data={childGenderDistribution} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: CUMPLEAÑOS */}
        <div>
          <h1 className="mb-6 text-2xl font-bold text-[#4b207f]">Cumpleaños del Trimestre</h1>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Cumpleaños de miembros */}
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#4b207f]">Miembros</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedQuarter('current')}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      selectedQuarter === 'current'
                        ? 'bg-[#4b207f] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Actual
                  </button>
                  <button
                    onClick={() => setSelectedQuarter('previous')}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      selectedQuarter === 'previous'
                        ? 'bg-[#4b207f] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      downloadBirthdaysCSV(getSelectedQuarterBirthdays().memberBirthdays, 'members')
                    }
                    disabled={getSelectedQuarterBirthdays().memberBirthdays.length === 0}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      getSelectedQuarterBirthdays().memberBirthdays.length > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'cursor-not-allowed bg-gray-300 text-gray-500'
                    }`}
                    title="Descargar lista en CSV"
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
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mb-2 text-sm text-[#7c7c7c]">{getQuarterLabel()}</div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-[#7c7c7c]">Cargando...</div>
                ) : getSelectedQuarterBirthdays().memberBirthdays.length > 0 ? (
                  <div className="space-y-1">
                    {getSelectedQuarterBirthdays().memberBirthdays.map(
                      (birthday: BirthdayData, index: number) => (
                        <div key={index} className="text-sm text-[#7c7c7c]">
                          {birthday.name} - {formatBirthday(birthday.birthDate)}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center text-[#7c7c7c]">
                    No hay cumpleaños en este trimestre
                  </div>
                )}
              </div>
            </div>

            {/* Cumpleaños de niños */}
            <div className="rounded-2xl border border-[#ececec] bg-[#fcfbfa] p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#4b207f]">Niños</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedQuarter('current')}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      selectedQuarter === 'current'
                        ? 'bg-[#4b207f] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Actual
                  </button>
                  <button
                    onClick={() => setSelectedQuarter('previous')}
                    className={`rounded px-3 py-1 text-sm font-medium ${
                      selectedQuarter === 'previous'
                        ? 'bg-[#4b207f] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      downloadBirthdaysCSV(getSelectedQuarterBirthdays().childBirthdays, 'children')
                    }
                    disabled={getSelectedQuarterBirthdays().childBirthdays.length === 0}
                    className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                      getSelectedQuarterBirthdays().childBirthdays.length > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'cursor-not-allowed bg-gray-300 text-gray-500'
                    }`}
                    title="Descargar lista en CSV"
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
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mb-2 text-sm text-[#7c7c7c]">{getQuarterLabel()}</div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-[#7c7c7c]">Cargando...</div>
                ) : getSelectedQuarterBirthdays().childBirthdays.length > 0 ? (
                  <div className="space-y-1">
                    {getSelectedQuarterBirthdays().childBirthdays.map(
                      (birthday: BirthdayData, index: number) => (
                        <div key={index} className="text-sm text-[#7c7c7c]">
                          {birthday.name} - {formatBirthday(birthday.birthDate)}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center text-[#7c7c7c]">
                    No hay cumpleaños en este trimestre
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
