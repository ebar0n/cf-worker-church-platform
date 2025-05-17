import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

const friendRequestSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  address: z.string().optional(),
  reason: z.enum(['oracion', 'visita', 'informacion']),
});

export async function POST(req: NextRequest) {
  const { env } = getCloudflareContext();
  console.log({ message: 'Hello World', env: env.DB });
  const adapter = new PrismaD1(env.DB);
  const prisma = new PrismaClient({ adapter });

  try {
    const data = await req.json();
    const parse = friendRequestSchema.safeParse(data);
    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parse.error.errors },
        { status: 400 }
      );
    }
    const { name, phone, address, reason } = parse.data;

    const friend = await prisma.friendRequest.create({
      data: {
        name,
        phone,
        address: address || '',
        reason,
      },
    });

    return NextResponse.json({ success: true, friend });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error', details: error }, { status: 500 });
  }
}
