import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });

  // Get friend requests
  const friendRequests = await env.DB.prepare(
    'SELECT * FROM FriendRequest'
  ).all();

  // Get members
  const members = await env.DB.prepare(
    'SELECT * FROM Member'
  ).all();

  // Agrupar solicitudes por tipo
  const requestTypes = ['oracion', 'visita', 'informacion'];
  const chartData = requestTypes.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: friendRequests.results.filter((fr: any) => fr.reason === type).length,
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

  return NextResponse.json({
    totalMembers: members.results.length,
    totalFriends: friendRequests.results.length,
    chartData,
    yearChartData,
  });
}
