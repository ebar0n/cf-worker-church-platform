import { NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';


export async function GET() {
  const { env } = getCloudflareContext();
  const adapter = new PrismaD1(env.DB);
  const prisma = new PrismaClient({ adapter });

  const requests = await prisma.friendRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(requests);
}
