'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import BarChartCustom from '@/app/admin/components/BarChartCustom';
import AreaChartCustom from '@/app/admin/components/AreaChartCustom';
import { Cake, Download } from 'lucide-react';
import { todayInBogota } from '@/lib/age-classification';

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
    // Same calendar as the server's birthday lists
    const currentDate = todayInBogota();
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
      <div className="space-y-12">
        {/* SECCIÓN 1: SOLICITUDES */}
        <div>
          <h1 className="mb-5 text-[28px] leading-tight md:text-[32px]">Solicitudes</h1>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="border-line rounded-2xl border bg-white p-6">
              <h2 className="text-ink-soft font-sans text-[13px] font-medium tracking-normal">
                Total de solicitudes
              </h2>
              <div className="font-heading mt-3 text-5xl font-bold leading-none">
                {loading ? '...' : totalFriends}
              </div>
              <div className="text-ink-soft mt-3 text-sm">Solicitudes nuevas (sin leer)</div>
            </div>
            <div className="border-line rounded-2xl border bg-white p-6 lg:col-span-2">
              <h2 className="mb-4 text-2xl leading-tight">Solicitudes por tipo</h2>
              <BarChartCustom data={chartData} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: MIEMBROS */}
        <div>
          <h1 className="mb-5 text-[28px] leading-tight md:text-[32px]">Miembros</h1>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="border-line rounded-2xl border bg-white p-6">
              <h2 className="text-ink-soft font-sans text-[13px] font-medium tracking-normal">
                Total de miembros
              </h2>
              <div className="font-heading mt-3 text-5xl font-bold leading-none">
                {loading ? '...' : totalMembers}
              </div>
              <div className="text-ink-soft mt-3 text-sm">Miembros registrados en la iglesia</div>
            </div>
            <div className="border-line rounded-2xl border bg-white p-6 lg:col-span-2">
              <h2 className="mb-4 text-2xl leading-tight">Miembros por año de bautismo</h2>
              <AreaChartCustom data={yearChartData} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="border-line rounded-2xl border bg-white p-6">
              <h2 className="mb-4 text-2xl leading-tight">Miembros por edad actual</h2>
              <BarChartCustom data={memberAgeRanges} />
            </div>
            <div className="border-line rounded-2xl border bg-white p-6">
              <h2 className="mb-4 text-2xl leading-tight">Distribución por género</h2>
              <BarChartCustom data={memberGenderDistribution} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: NIÑOS */}
        <div>
          <h1 className="mb-5 text-[28px] leading-tight md:text-[32px]">Niños</h1>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="border-line rounded-2xl border bg-white p-6">
              <h2 className="text-ink-soft font-sans text-[13px] font-medium tracking-normal">
                Total de niños
              </h2>
              <div className="font-heading mt-3 text-5xl font-bold leading-none">
                {loading ? '...' : totalChildren}
              </div>
              <div className="text-ink-soft mt-3 text-sm">Niños registrados</div>
            </div>
            <div className="border-line rounded-2xl border bg-white p-6">
              <h2 className="mb-4 text-2xl leading-tight">Niños por edad</h2>
              <BarChartCustom data={childAgeRanges} />
            </div>
            <div className="border-line rounded-2xl border bg-white p-6">
              <h2 className="mb-4 text-2xl leading-tight">Distribución por género</h2>
              <BarChartCustom data={childGenderDistribution} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: CUMPLEAÑOS */}
        <div>
          <h1 className="mb-5 text-[28px] leading-tight md:text-[32px]">
            Cumpleaños del Trimestre
          </h1>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Cumpleaños de miembros */}
            <div className="border-line rounded-2xl border bg-white p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl leading-tight">Miembros</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedQuarter('current')}
                    className={`h-10 rounded-xl border px-3 text-sm font-medium transition-colors ${
                      selectedQuarter === 'current'
                        ? 'border-ink bg-warm-soft text-ink'
                        : 'border-line text-ink-soft bg-white hover:bg-gray-100'
                    }`}
                  >
                    Actual
                  </button>
                  <button
                    onClick={() => setSelectedQuarter('previous')}
                    className={`h-10 rounded-xl border px-3 text-sm font-medium transition-colors ${
                      selectedQuarter === 'previous'
                        ? 'border-ink bg-warm-soft text-ink'
                        : 'border-line text-ink-soft bg-white hover:bg-gray-100'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      downloadBirthdaysCSV(getSelectedQuarterBirthdays().memberBirthdays, 'members')
                    }
                    disabled={getSelectedQuarterBirthdays().memberBirthdays.length === 0}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                      getSelectedQuarterBirthdays().memberBirthdays.length > 0
                        ? 'border-line text-ink bg-white hover:bg-gray-100'
                        : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
                    }`}
                    title="Descargar lista en CSV"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div className="text-ink-soft mb-3 text-[13px]">{getQuarterLabel()}</div>
              <div>
                {loading ? (
                  <div className="text-ink-soft text-sm">Cargando...</div>
                ) : getSelectedQuarterBirthdays().memberBirthdays.length > 0 ? (
                  <div className="divide-line divide-y">
                    {getSelectedQuarterBirthdays().memberBirthdays.map(
                      (birthday: BirthdayData, index: number) => (
                        <div key={index} className="text-ink py-2.5 text-[15px]">
                          {birthday.name} - {formatBirthday(birthday.birthDate)}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
                    <div className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
                      <Cake className="text-ink h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div className="text-[15px] font-semibold">
                      No hay cumpleaños en este trimestre
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cumpleaños de niños */}
            <div className="border-line rounded-2xl border bg-white p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl leading-tight">Niños</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedQuarter('current')}
                    className={`h-10 rounded-xl border px-3 text-sm font-medium transition-colors ${
                      selectedQuarter === 'current'
                        ? 'border-ink bg-warm-soft text-ink'
                        : 'border-line text-ink-soft bg-white hover:bg-gray-100'
                    }`}
                  >
                    Actual
                  </button>
                  <button
                    onClick={() => setSelectedQuarter('previous')}
                    className={`h-10 rounded-xl border px-3 text-sm font-medium transition-colors ${
                      selectedQuarter === 'previous'
                        ? 'border-ink bg-warm-soft text-ink'
                        : 'border-line text-ink-soft bg-white hover:bg-gray-100'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      downloadBirthdaysCSV(getSelectedQuarterBirthdays().childBirthdays, 'children')
                    }
                    disabled={getSelectedQuarterBirthdays().childBirthdays.length === 0}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                      getSelectedQuarterBirthdays().childBirthdays.length > 0
                        ? 'border-line text-ink bg-white hover:bg-gray-100'
                        : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
                    }`}
                    title="Descargar lista en CSV"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div className="text-ink-soft mb-3 text-[13px]">{getQuarterLabel()}</div>
              <div>
                {loading ? (
                  <div className="text-ink-soft text-sm">Cargando...</div>
                ) : getSelectedQuarterBirthdays().childBirthdays.length > 0 ? (
                  <div className="divide-line divide-y">
                    {getSelectedQuarterBirthdays().childBirthdays.map(
                      (birthday: BirthdayData, index: number) => (
                        <div key={index} className="text-ink py-2.5 text-[15px]">
                          {birthday.name} - {formatBirthday(birthday.birthDate)}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
                    <div className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
                      <Cake className="text-ink h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div className="text-[15px] font-semibold">
                      No hay cumpleaños en este trimestre
                    </div>
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
