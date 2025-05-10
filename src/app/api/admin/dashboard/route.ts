import { NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  const { env } = getCloudflareContext();
  const adapter = new PrismaD1(env.DB);
  const prisma = new PrismaClient({ adapter });

  const friendRequests = await prisma.friendRequest.findMany();
  const members = await prisma.member.findMany();

  // Agrupar solicitudes por tipo
  const requestTypes = ['oracion', 'visita', 'informacion'];
  const chartData = requestTypes.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: friendRequests.filter((fr: any) => fr.reason === type).length,
  }));

  // Agrupar miembros por año de bautismo (ignorando nulos)
  const membersByYear: Record<number, number> = {};
  members.forEach((m: any) => {
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
    totalMembers: members.length,
    totalFriends: friendRequests.length,
    chartData,
    yearChartData,
  });
}
