import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });

  // Get friend requests
  const friendRequests = await env.DB.prepare('SELECT * FROM FriendRequest').all();

  // Get members
  const members = await env.DB.prepare('SELECT * FROM Member').all();

  // Get children
  const children = await env.DB.prepare('SELECT * FROM Child').all();

  // Current date for birthday calculations
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  // Calculate current quarter (1-4)
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Calculate start and end months for current quarter
  const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
  const quarterEndMonth = currentQuarter * 3;

  // Calculate previous quarter
  const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const previousQuarterStartMonth = (previousQuarter - 1) * 3 + 1;
  const previousQuarterEndMonth = previousQuarter * 3;

  // Adjust year for previous quarter if needed
  const previousQuarterYear = currentQuarter === 1 ? currentYear - 1 : currentYear;

  // Agrupar solicitudes por tipo (solo no leídas)
  const requestTypes = ['oracion', 'visita', 'informacion'];
  const chartData = requestTypes.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: friendRequests.results.filter((fr: any) => fr.reason === type && !fr.isRead).length,
  }));

  // Agrupar miembros por año de bautismo (ignorando nulos)
  const membersByYear: Record<number, number> = {};
  members.results.forEach((m: any) => {
    if (typeof m.baptismYear === 'number' && !isNaN(m.baptismYear)) {
      if (!membersByYear[m.baptismYear]) membersByYear[m.baptismYear] = 0;
      membersByYear[m.baptismYear]++;
    }
  });
  const yearChartData = Object.entries(membersByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({
      year,
      count,
    }));

  // Helper function to get birthdays for a specific quarter
  const getBirthdaysForQuarter = (startMonth: number, endMonth: number, year: number) => {
    const memberBirthdays = members.results
      .filter((m: any) => {
        if (!m.birthDate) return false;
        // Extract month directly from date string to avoid timezone issues
        const birthMonth = parseInt(m.birthDate.split('T')[0].split('-')[1]);
        return birthMonth >= startMonth && birthMonth <= endMonth;
      })
      .map((m: any) => ({
        name: m.name,
        birthDate: m.birthDate,
        type: 'member',
      }))
      .sort((a: any, b: any) => {
        // Sort by month and day directly from date strings
        const [yearA, monthA, dayA] = a.birthDate.split('T')[0].split('-').map(Number);
        const [yearB, monthB, dayB] = b.birthDate.split('T')[0].split('-').map(Number);
        // Sort by month first, then by day
        if (monthA !== monthB) {
          return monthA - monthB;
        }
        return dayA - dayB;
      });

    const childBirthdays = children.results
      .filter((c: any) => {
        if (!c.birthDate) return false;
        // Extract month directly from date string to avoid timezone issues
        const birthMonth = parseInt(c.birthDate.split('T')[0].split('-')[1]);
        return birthMonth >= startMonth && birthMonth <= endMonth;
      })
      .map((c: any) => ({
        name: c.name,
        birthDate: c.birthDate,
        type: 'child',
      }))
      .sort((a: any, b: any) => {
        // Sort by month and day directly from date strings
        const [yearA, monthA, dayA] = a.birthDate.split('T')[0].split('-').map(Number);
        const [yearB, monthB, dayB] = b.birthDate.split('T')[0].split('-').map(Number);
        // Sort by month first, then by day
        if (monthA !== monthB) {
          return monthA - monthB;
        }
        return dayA - dayB;
      });

    return { memberBirthdays, childBirthdays };
  };

  // Get birthdays for current and previous quarters
  const currentQuarterBirthdays = getBirthdaysForQuarter(
    quarterStartMonth,
    quarterEndMonth,
    currentYear
  );
  const previousQuarterBirthdays = getBirthdaysForQuarter(
    previousQuarterStartMonth,
    previousQuarterEndMonth,
    previousQuarterYear
  );

  // Análisis demográfico - género de miembros
  const memberGenderDistribution = members.results.reduce((acc: any, m: any) => {
    const gender = m.gender || 'No especificado';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  // Análisis demográfico - género de niños
  const childGenderDistribution = children.results.reduce((acc: any, c: any) => {
    const gender = c.gender || 'No especificado';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  // Distribución de edad actual de miembros
  const memberAgeRanges = {
    '0-17': 0,
    '18-25': 0,
    '26-35': 0,
    '36-50': 0,
    '51-65': 0,
    '65+': 0,
    'Sin fecha': 0,
  };

  members.results.forEach((m: any) => {
    if (!m.birthDate) {
      memberAgeRanges['Sin fecha']++;
      return;
    }

    // Extract year directly from date string to avoid timezone issues
    const birthYear = parseInt(m.birthDate.split('T')[0].split('-')[0]);
    const age = currentDate.getFullYear() - birthYear;

    if (age < 18) memberAgeRanges['0-17']++;
    else if (age <= 25) memberAgeRanges['18-25']++;
    else if (age <= 35) memberAgeRanges['26-35']++;
    else if (age <= 50) memberAgeRanges['36-50']++;
    else if (age <= 65) memberAgeRanges['51-65']++;
    else memberAgeRanges['65+']++;
  });

  // Distribución de edad de niños
  const childAgeRanges = {
    '0-2': 0,
    '3-5': 0,
    '6-8': 0,
    '9-11': 0,
    '12-14': 0,
    '15-17': 0,
    'Sin fecha': 0,
  };

  children.results.forEach((c: any) => {
    if (!c.birthDate) {
      childAgeRanges['Sin fecha']++;
      return;
    }

    // Extract year directly from date string to avoid timezone issues
    const birthYear = parseInt(c.birthDate.split('T')[0].split('-')[0]);
    const age = currentDate.getFullYear() - birthYear;

    if (age <= 2) childAgeRanges['0-2']++;
    else if (age <= 5) childAgeRanges['3-5']++;
    else if (age <= 8) childAgeRanges['6-8']++;
    else if (age <= 11) childAgeRanges['9-11']++;
    else if (age <= 14) childAgeRanges['12-14']++;
    else if (age <= 17) childAgeRanges['15-17']++;
    else childAgeRanges['Sin fecha']++; // Niños mayores de 17
  });

  return NextResponse.json({
    totalMembers: members.results.length,
    totalFriends: friendRequests.results.filter((fr: any) => !fr.isRead).length,
    totalChildren: children.results.length,
    chartData,
    yearChartData,
    currentQuarterBirthdays,
    previousQuarterBirthdays,
    memberGenderDistribution,
    childGenderDistribution,
    memberAgeRanges,
    childAgeRanges,
  });
}
